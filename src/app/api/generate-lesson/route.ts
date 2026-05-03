import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, FetchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

interface LessonRequest {
  subject: string;
  grade: string;
  courseTheme: string;
  studentInterests: string;
  teacherStyle: string;
  outputTypes: string[];
  textbookContent: string;
  files?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
}

// 解析文件内容
async function parseFileContent(
  file: { name: string; type: string; url: string },
  config: Config,
  customHeaders: Record<string, string>
): Promise<string> {
  try {
    if (file.type.startsWith('image/')) {
      console.log(`Processing image: ${file.name}`);
      const llmClient = new LLMClient(config, customHeaders);
      
      const messages = [
        {
          role: 'user' as const,
          content: [
            {
              type: 'text' as const,
              text: '请详细识别并提取这张图片中的所有文字内容，包括标题、正文、注释等。如果是教材页面，请按原有的结构和层次整理输出。只输出识别到的内容，不要添加额外的解释。',
            },
            {
              type: 'image_url' as const,
              image_url: {
                url: file.url,
                detail: 'high' as const,
              },
            },
          ],
        },
      ];

      // 添加超时控制，最多等待30秒
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('图片识别超时')), 30000);
      });

      const response = await Promise.race([
        llmClient.invoke(messages, {
          model: 'doubao-seed-1-6-vision-250815',
          temperature: 0.3,
        }),
        timeoutPromise,
      ]);

      console.log(`Image processed successfully: ${file.name}`);
      return `\n【图片文件：${file.name}】\n${response.content}\n`;
    }

    const fetchClient = new FetchClient(config, customHeaders);
    const response = await fetchClient.fetch(file.url);

    const textContent = response.content
      .filter((item) => item.type === 'text' && item.text)
      .map((item) => item.text)
      .join('\n');

    return `\n【文件：${file.name}】\n${textContent}\n`;
  } catch (error) {
    console.error(`Failed to parse file ${file.name}:`, error);
    return `\n【文件：${file.name}】\n（文件解析失败或超时，请检查文件是否有效）\n`;
  }
}

// 判断是否为未成年人年级
function isMinorGrade(grade: string): boolean {
  const minorGrades = ['一', '二', '三', '四', '五', '六', '初一', '初二', '初三', '七', '八', '九', '高一', '高二', '高三'];
  return minorGrades.some(g => grade.includes(g));
}

// 获取未成年人保护提示
function getMinorProtectionPrompt(grade: string): string {
  if (!isMinorGrade(grade)) return '';
  
  return `
## ⚠️ 未成年人保护特别注意事项（必须遵守）

本课程面向未成年人学生（${grade}），在设计教学内容时必须严格遵守以下规定：

1. **游戏活动限制**：
   - 游戏活动时长控制在课堂范围内（通常40-45分钟）
   - 不得设计需要课后继续进行的游戏任务
   - 不得设置诱导性充值、消费环节
   - 不得设计需要长时间在线的活动

2. **内容安全**：
   - 不得包含暴力、血腥、恐怖元素
   - 不得包含不良价值观引导
   - 不得包含商业广告或推广内容
   - 避免过度竞争导致学生心理压力

3. **隐私保护**：
   - 不要求学生提供真实姓名、联系方式等个人信息
   - 不涉及学生照片、视频等个人数据的收集

4. **身心健康**：
   - 注意用眼卫生，控制屏幕使用时间
   - 设计适当的休息和活动环节
   - 关注学生参与度，避免学生产生挫败感

5. **教育导向**：
   - 游戏活动必须服务于教学目标
   - 强调学习收获而非游戏得分
   - 引导学生正确看待游戏与学习的关系

`;
}

// 输出类型标签映射
const OUTPUT_TYPE_LABELS: Record<string, string> = {
  'lesson-plan': '完整教案',
  'guide-plan': '导学案',
  'ppt-outline': 'PPT大纲',
  'game-design': '游戏活动设计',
  'script': '逐字稿',
};

// 根据输出类型生成不同的系统提示
function getSystemPrompt(outputType: string, grade: string, teacherStyle: string, courseTheme?: string): string {
  const minorProtection = getMinorProtectionPrompt(grade);
  const stylePrompt = teacherStyle ? `\n## 教师风格要求\n请以"${teacherStyle}"的风格撰写内容，确保语言风格与教师个人风格一致。\n` : '';
  const themePrompt = courseTheme ? `\n## 课程主题/设计要求\n${courseTheme}\n\n请务必严格按照以上课程主题和设计要求来设计教学内容，包括活动名称、情境创设、教学流程等都要紧扣主题。\n` : '';

  const basePrompt = `你是一位资深的教学设计专家，精通多种教学资源的开发。你的任务是帮助教师设计高质量的教学材料。
${minorProtection}
${stylePrompt}
${themePrompt}
`;

  switch (outputType) {
    case 'lesson-plan':
      return basePrompt + `
## 输出类型：完整教案

请严格按照以下格式输出完整的教案：

---
# 《课程名称》教案

## 一、教学目标
### 知识与技能目标
[学生需要掌握的知识和技能]

### 过程与方法目标
[学生需要经历的学习过程和方法]

### 情感态度与价值观目标
[学生需要培养的情感态度和价值观]

## 二、教学重难点
### 教学重点
[本课最重要的知识点]

### 教学难点
[学生最难理解或掌握的内容]

## 三、教学方法
[采用的主要教学方法，如：讲授法、讨论法、探究法等]

## 四、教学准备
[教师需要准备的教具、多媒体资源等]

## 五、教学过程

### 环节一：导入新课（约5分钟）
**教师活动**：[具体活动内容]
**学生活动**：[学生需要做什么]
**设计意图**：[为什么要这样设计]

### 环节二：新课讲授（约25分钟）
**教师活动**：[具体活动内容]
**学生活动**：[学生需要做什么]
**设计意图**：[为什么要这样设计]

### 环节三：巩固练习（约10分钟）
**教师活动**：[具体活动内容]
**学生活动**：[学生需要做什么]
**设计意图**：[为什么要这样设计]

### 环节四：课堂小结（约3分钟）
**教师活动**：[具体活动内容]
**学生活动**：[学生需要做什么]
**设计意图**：[为什么要这样设计]

### 环节五：布置作业（约2分钟）
**作业内容**：[具体作业]

## 六、板书设计
[板书的结构和内容]

## 七、教学反思
[预设的教学反思要点]

---
`;

    case 'guide-plan':
      return basePrompt + `
## 输出类型：导学案

导学案是学生自主学习的导航工具，请严格按照以下格式输出：

---
# 《课程名称》导学案

**班级：______ 姓名：______ 日期：______**

## 一、学习目标
1. 我能够...[知识与技能目标，用"我能够"句式]
2. 我能够...[过程与方法目标]
3. 我能够体会/理解/感受...[情感态度目标]

## 二、学习重难点
- **重点**：[本课最重要的知识点]
- **难点**：[最需要努力理解的内容]

## 三、课前预习
### 知识链接
[与本课相关的已学知识回顾]

### 预习任务
1. 阅读课本第___页，划出你不理解的句子
2. 查阅资料，了解...的背景
3. 思考问题：[引导性问题]

### 我的疑问
（预习中遇到的问题，请在下方记录）
_________________________________

## 四、课堂探究
### 探究一：[探究主题]
**活动要求**：[具体要求]
**思考问题**：
1. [问题1]
2. [问题2]

**我的记录**：
_________________________________

### 探究二：[探究主题]
**活动要求**：[具体要求]
**思考问题**：
1. [问题1]

**我的发现**：
_________________________________

## 五、当堂检测
### 基础达标
1. [基础题目，检测基本知识掌握]
2. [基础题目]

### 能力提升
1. [稍有难度的题目]
2. [拓展性题目]

### 挑战自我（选做）
1. [高难度题目，鼓励学有余力的学生尝试]

## 六、课堂小结
通过本节课的学习，我的收获是：
_________________________________
我还不清楚的是：
_________________________________

## 七、课后作业
1. [必做作业]
2. [选做作业]

---
`;

    case 'ppt-outline':
      return basePrompt + `
## 输出类型：PPT大纲

请为演示文稿设计清晰的结构框架，输出格式如下：

---
# 《课程名称》PPT大纲

## 基本信息
- **总页数建议**：15-20页
- **设计风格建议**：[如：简约学术风、活泼卡通风等，根据学生特点建议]
- **主色调建议**：[根据学科和内容建议配色]

## 幻灯片结构

### 第1页：封面
**标题**：[课程标题]
**副标题**：[可选]
**设计建议**：[配图、布局建议]

### 第2页：学习目标
**内容**：
- 目标1
- 目标2
- 目标3
**设计建议**：[如何呈现]

### 第3页：导入/情境创设
**内容**：[导入内容或情境]
**设计建议**：[配图、动画建议]

### 第4-5页：[知识点1]
**标题**：[知识点名称]
**内容要点**：
- 要点1
- 要点2
**设计建议**：[图表、图示建议]

### 第6-7页：[知识点2]
**标题**：[知识点名称]
**内容要点**：
- 要点1
- 要点2
**设计建议**：[如何呈现]

### 第8-9页：例题/案例分析
**内容**：[例题或案例]
**设计建议**：[分步呈现的动画建议]

### 第10-11页：课堂练习
**内容**：[练习题目]
**设计建议**：[互动方式建议]

### 第12页：知识总结
**内容**：[知识框架图]
**设计建议**：[思维导图或框架图]

### 第13页：课堂小结
**内容**：
- 本节课学到了什么
- 重点回顾
**设计建议**：[呈现方式]

### 第14页：课后作业
**内容**：
- 必做作业
- 选做作业
**设计建议**：[清晰列出]

### 第15页：结束页
**内容**：感谢聆听 / 欢迎提问
**设计建议**：[简洁设计]

## 设计注意事项
1. [针对本课的具体设计建议]
2. [字体、字号建议]
3. [图片使用建议]

---
`;

    case 'game-design':
      return basePrompt + `
## 输出类型：游戏活动设计

请设计一个完整的课堂游戏活动，用于本课教学：
${minorProtection ? '**重要：本游戏面向未成年人学生，必须严格遵守未成年人保护相关要求！**\n' : ''}

---
# 《课程名称》游戏活动设计

## 一、游戏概述
### 游戏名称
[富有吸引力的游戏名称]

### 游戏目标
[通过游戏要达成的教学目标]

### 适用对象
${grade || '[年级]'}学生

### 游戏时长
[建议控制在XX分钟内，不超过课堂时间的1/3]

### 游戏类型
[如：角色扮演、知识竞赛、团队合作、闯关挑战等]

## 二、游戏规则

### 角色设置
- [角色1]：[职责说明]
- [角色2]：[职责说明]

### 游戏流程
**第一阶段：准备（X分钟）**
1. [具体步骤]
2. [具体步骤]

**第二阶段：游戏主体（X分钟）**
1. [具体步骤]
2. [具体步骤]

**第三阶段：总结评价（X分钟）**
1. [具体步骤]
2. [具体步骤]

### 计分规则
[清晰、公平的计分方式]
**注意**：分数仅作为游戏激励，不与学生成绩挂钩

## 三、游戏材料
- [所需材料清单]
- [材料准备建议]

## 四、教学融入

### 知识点融入方式
[游戏如何服务于本课教学目标]

### 知识检测点
- 检测点1：[游戏中检测知识掌握的环节]
- 检测点2：[...]

## 五、教师指导要点

### 游戏前
- [教师需要做的准备工作]
- [需要强调的规则和安全事项]

### 游戏中
- [教师观察要点]
- [干预时机和方式]
- [时间控制建议]

### 游戏后
- [总结提升的方式]
- [情感价值观引导]

## 六、学生参与指导
[学生如何参与游戏的说明，可作为学生阅读材料]

## 七、应急预案
- 如果学生积极性不高：[应对措施]
- 如果游戏超时：[应对措施]
- 如果出现争议：[公平裁决方式]

## 八、变式拓展
[如何调整游戏难度或形式以适应不同学生]

---
`;

    case 'script':
      return basePrompt + `
## 输出类型：逐字稿

请撰写一份教师课堂讲解的完整文字稿，可以直接用于备课参考：

---
# 《课程名称》课堂逐字稿

**授课教师**：[教师姓名]
**授课时间**：[建议时长]
**授课对象**：${grade || '[年级]'}学生

---

## 【课前准备】
（铃声响，学生入座）
同学们好！请坐。

---

## 【导入环节】（约5分钟）

（教师走上讲台，面带微笑）

同学们，在开始今天的新课之前，老师想先问大家一个问题：[导入问题]

（稍作停顿，环顾教室）

好，请举手回答。这位同学，请你来说一说。

（认真倾听学生回答，点头）

嗯，说得很好！这位同学提到......（复述学生回答的要点）

今天，我们就一起来学习......（引出课题，板书课题）

---

## 【新课讲授】（约25分钟）

### 一、[第一个知识点]

现在，请大家翻开课本第___页，看第___段。

（等待学生翻书）

大家都找到了吗？好，我们一起来读一读这段话。

（领读或指名学生朗读）

读得很好！那么，这段话告诉了我们什么呢？

（在黑板上板书要点）

我们一起来总结一下......

### 二、[第二个知识点]

接下来，我们来看......

（继续讲解，穿插提问和互动）

同学们注意看这个例子......

（详细讲解）

好，现在请大家思考一个问题：......？

（给学生思考时间，然后提问）

这位同学请回答......很好！

---

## 【巩固练习】（约10分钟）

现在，我们来做个小练习巩固一下今天学的内容。

（布置练习）

请同学们独立完成，有问题的可以举手。

（巡视课堂，个别指导）

好，时间到。我们来看看答案......

---

## 【课堂小结】（约3分钟）

好，同学们，今天的课就要结束了。让我们一起来回顾一下今天学到了什么。

（带领学生回顾知识点）

今天我们学习了......掌握了......

---

## 【布置作业】（约2分钟）

今天的作业是：
1. 完成课本第___页练习题
2. 预习下一课内容

---

## 【结束语】

好，这节课就到这里。下课！

同学们再见！

---

## 教学板书设计
[在黑板上的板书结构]

## 教师备课备注
- [重点强调的内容]
- [容易出错的地方]
- [需要准备的教具]

---
`;

    default:
      return basePrompt;
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: LessonRequest = await request.json();
    const { subject, grade, courseTheme, studentInterests, teacherStyle, outputTypes, textbookContent, files } = data;

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();

    // 构建完整的教材内容
    let fullContent = textbookContent || '';

    // 先处理文件，在流开始前完成
    if (files && files.length > 0) {
      console.log(`Processing ${files.length} files...`);
      const fileContents = await Promise.all(
        files.map((file) => parseFileContent(file, config, customHeaders))
      );
      fullContent = fullContent + '\n' + fileContents.join('\n');
      console.log('Files processed successfully');
    }

    if (!fullContent.trim()) {
      return NextResponse.json({ error: '请输入教材内容或上传文件' }, { status: 400 });
    }

    // 确保至少有一个输出类型
    const types = outputTypes && outputTypes.length > 0 ? outputTypes : ['lesson-plan'];

    const client = new LLMClient(config, customHeaders);

    const encoder = new TextEncoder();
    let isControllerClosed = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 依次生成每种类型的内容
          for (let i = 0; i < types.length; i++) {
            if (isControllerClosed) break;
            
            const outputType = types[i];
            const label = OUTPUT_TYPE_LABELS[outputType] || outputType;

            // 添加分隔标题（使用特殊标记便于前端解析）
            if (types.length > 1) {
              const separator = `\n\n<<<RESOURCE_SEPARATOR type="${outputType}" label="${label}" index="${i + 1}" total="${types.length}"/>>>\n\n`;
              controller.enqueue(encoder.encode(separator));
            }

            const systemPrompt = getSystemPrompt(outputType, grade || '', teacherStyle || '', courseTheme);

            const userPrompt = `请根据以下信息生成${label}：

**学科**：${subject || '未指定'}
**年级**：${grade || '未指定'}
**学生特点**：${studentInterests || '未提供'}
**教师风格**：${teacherStyle || '未指定'}
${courseTheme ? `**课程主题/设计要求**：${courseTheme}` : ''}

**教材内容**：
${fullContent}

请生成完整、专业、可直接使用的内容。${courseTheme ? '务必按照课程主题/设计要求来设计教学内容和活动。' : ''}`;

            const messages = [
              { role: 'system' as const, content: systemPrompt },
              { role: 'user' as const, content: userPrompt },
            ];

            try {
              const llmStream = client.stream(messages, {
                model: 'doubao-seed-2-0-pro-260215',
                temperature: 0.7,
              });

              for await (const chunk of llmStream) {
                if (isControllerClosed) break;
                if (chunk.content) {
                  const text = chunk.content.toString();
                  controller.enqueue(encoder.encode(text));
                }
              }
            } catch (streamError) {
              console.error(`Error generating ${label}:`, streamError);
              if (!isControllerClosed) {
                controller.enqueue(encoder.encode(`\n\n【${label}生成失败，继续生成下一项...】\n\n`));
              }
            }

            // 如果还有下一个类型，添加分隔
            if (i < types.length - 1 && !isControllerClosed) {
              controller.enqueue(encoder.encode('\n\n'));
            }
          }

          if (!isControllerClosed) {
            controller.close();
            isControllerClosed = true;
          }
        } catch (error) {
          console.error('Stream error:', error);
          if (!isControllerClosed) {
            try {
              controller.enqueue(encoder.encode('\n\n生成过程中出现错误，请重试。'));
              controller.close();
            } catch {
              // Controller already closed, ignore
            }
            isControllerClosed = true;
          }
        }
      },
      cancel() {
        isControllerClosed = true;
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: '生成失败，请重试' },
      { status: 500 }
    );
  }
}
