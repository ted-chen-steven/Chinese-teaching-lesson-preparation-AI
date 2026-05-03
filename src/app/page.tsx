'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Sparkles,
  BookOpen,
  Users,
  Lightbulb,
  Upload,
  FileText,
  Image as ImageIcon,
  X,
  File,
  ChevronDown,
  FileCheck,
  Presentation,
  Gamepad2,
  FileTextIcon,
  PenTool,
  Check,
  Palette,
  Download,
  FileDown,
} from 'lucide-react';

// 简单的 Markdown 渲染组件
function SimpleMarkdown({ content }: { content: string }) {
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc pl-6 my-2 space-y-1">
            {listItems.map((item, i) => (
              <li key={i} className="text-muted-foreground">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      // 一级标题
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={index} className="text-2xl font-bold text-foreground border-b border-border pb-3 mb-4 mt-6 first:mt-0">
            {line.slice(2)}
          </h1>
        );
        return;
      }
      // 二级标题
      if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={index} className="text-xl font-semibold text-foreground mt-6 mb-3">
            {line.slice(3)}
          </h2>
        );
        return;
      }
      // 三级标题
      if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={index} className="text-lg font-medium text-foreground mt-4 mb-2">
            {line.slice(4)}
          </h3>
        );
        return;
      }
      // 四级标题
      if (line.startsWith('#### ')) {
        flushList();
        elements.push(
          <h4 key={index} className="text-base font-medium text-foreground mt-3 mb-2">
            {line.slice(5)}
          </h4>
        );
        return;
      }
      // 列表项
      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          inList = true;
        }
        listItems.push(line.slice(2));
        return;
      }
      // 空行
      if (!line.trim()) {
        flushList();
        inList = false;
        return;
      }
      // 分隔线
      if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/)) {
        flushList();
        elements.push(<hr key={index} className="my-6 border-border" />);
        return;
      }
      
      flushList();
      inList = false;
      
      // 处理行内格式
      let processedLine = line;
      
      // 处理粗体 **text**
      processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
      // 处理斜体 *text*
      processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      elements.push(
        <p key={index} className="text-muted-foreground leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: processedLine }} />
      );
    });

    flushList();
    return elements;
  };

  return <div className="markdown-content">{renderMarkdown(content)}</div>;
}

// 预设选项
const SUBJECT_OPTIONS = [
  '语文',
  '数学',
  '英语',
  '物理',
  '化学',
  '生物',
  '历史',
  '地理',
  '政治',
  '道德与法治',
  '科学',
  '信息技术',
];

const GRADE_OPTIONS = [
  '一年级',
  '二年级',
  '三年级',
  '四年级',
  '五年级',
  '六年级',
  '七年级（初一）',
  '八年级（初二）',
  '九年级（初三）',
  '高一',
  '高二',
  '高三',
];

// 输出类型选项
const OUTPUT_TYPE_OPTIONS = [
  {
    value: 'lesson-plan',
    label: '教案',
    icon: FileCheck,
    description: '完整教学设计',
  },
  {
    value: 'guide-plan',
    label: '导学案',
    icon: PenTool,
    description: '学生自主学习',
  },
  {
    value: 'ppt-outline',
    label: 'PPT大纲',
    icon: Presentation,
    description: '演示文稿框架',
  },
  {
    value: 'game-design',
    label: '游戏活动',
    icon: Gamepad2,
    description: '课堂游戏设计',
  },
  {
    value: 'script',
    label: '逐字稿',
    icon: FileTextIcon,
    description: '课堂讲解稿',
  },
];

// 课程设计类型预设
const COURSE_DESIGN_OPTIONS = [
  {
    label: '一题到底',
    value: 'one-topic',
    template: '围绕一个核心议题贯穿整节课，所有教学环节围绕议题层层递进，形成完整的认知链条。',
  },
  {
    label: '情境体验式',
    value: 'scenario',
    template: '创设真实或模拟的情境，让学生在情境中体验、探究、解决问题，如"一日游"、"探案"等主题情境。',
  },
  {
    label: '项目式学习',
    value: 'pbl',
    template: '以项目任务驱动学习，学生通过完成项目来掌握知识，强调实践和应用。',
  },
  {
    label: '主题探究式',
    value: 'inquiry',
    template: '围绕一个主题展开深入探究，多角度分析问题，培养学生的探究能力和批判性思维。',
  },
  {
    label: '任务驱动式',
    value: 'task',
    template: '设置明确的任务目标，学生在完成任务的过程中习得知识和技能。',
  },
  {
    label: '游戏化教学',
    value: 'gamification',
    template: '将游戏元素融入教学，通过积分、闯关、竞争等机制激发学习兴趣。',
  },
  {
    label: '跨学科融合',
    value: 'interdisciplinary',
    template: '融合多个学科的知识和方法，培养学生的综合素养和跨学科思维。',
  },
  {
    label: '辩论研讨式',
    value: 'debate',
    template: '通过辩论或研讨的形式，引导学生在思辨中深化理解，培养批判性思维。',
  },
];

// 学生类型预设
const STUDENT_TYPE_OPTIONS = [
  {
    label: '基础班（兴趣驱动型）',
    value: 'base',
    description: '需要讲段子、结合网络热梗和有趣的新闻',
    template: '学生基础较薄弱，注意力容易分散，需要用生动有趣的方式吸引注意力。喜欢网络热梗、段子和有趣的新闻，对游戏、短视频、流行文化感兴趣。教学中需要多举生活中的例子，用幽默风趣的语言，把知识与他们熟悉的事物联系起来。',
  },
  {
    label: '提高班（知识驱动型）',
    value: 'advanced',
    description: '喜欢深度知识，可以跨学科讲解',
    template: '学生基础扎实，学习积极性高，喜欢深度思考和探究。对知识本身有强烈的好奇心，可以接受跨学科的拓展。教学中可以引入更深层次的分析，联系相关学科知识，培养高阶思维能力。',
  },
  {
    label: '竞赛班（挑战驱动型）',
    value: 'competition',
    description: '追求挑战，喜欢高难度问题',
    template: '学生成绩优异，喜欢挑战高难度问题，目标是各类竞赛。思维敏捷，逻辑能力强，对难题有征服欲。教学中可以引入竞赛真题，设计有挑战性的思考题，培养竞赛思维。',
  },
  {
    label: '艺术班（创意驱动型）',
    value: 'art',
    description: '思维活跃，喜欢创意表达',
    template: '学生思维活跃，喜欢创意表达，对艺术、音乐、设计等领域有浓厚兴趣。教学中可以用图像、故事、表演等方式呈现知识，鼓励创新思维和个性化表达。',
  },
];

// 教师风格预设
const TEACHER_STYLE_OPTIONS = [
  {
    value: 'serious',
    label: '严谨专业型',
    template: '教学风格严谨，注重知识的系统性和逻辑性，语言规范准确，课堂节奏紧凑高效。',
  },
  {
    value: 'humorous',
    label: '幽默风趣型',
    template: '善于用幽默的语言和有趣的例子讲解知识，课堂氛围轻松活跃，善于调动学生情绪。',
  },
  {
    value: 'gentle',
    label: '温和引导型',
    template: '语气温和亲切，善于倾听和引导，注重学生的情感体验，鼓励学生大胆表达。',
  },
  {
    value: 'passionate',
    label: '激情澎湃型',
    template: '教学充满激情和感染力，语言富有张力，善于用情感打动学生，营造热烈课堂氛围。',
  },
  {
    value: 'storytelling',
    label: '故事讲述型',
    template: '善于用故事串联知识点，把抽象知识具体化、情景化，让学生在故事中学习。',
  },
  {
    value: 'interactive',
    label: '互动交流型',
    template: '注重师生互动和学生参与，多采用提问、讨论、小组合作等方式，课堂以学生为主体。',
  },
];

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'uploading' | 'ready' | 'error';
}

interface FormData {
  subject: string;
  grade: string;
  courseTheme: string;
  studentInterests: string;
  teacherStyle: string;
  textbookContent: string;
}

interface GeneratedResource {
  type: string;
  label: string;
  content: string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    subject: '',
    grade: '',
    courseTheme: '',
    studentInterests: '',
    teacherStyle: '',
    textbookContent: '',
  });
  const [selectedOutputTypes, setSelectedOutputTypes] = useState<string[]>(['lesson-plan']);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [parsedResources, setParsedResources] = useState<GeneratedResource[]>([]);
  const [activeResourceTab, setActiveResourceTab] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [selectedStudentType, setSelectedStudentType] = useState<string>('');
  const [progressInfo, setProgressInfo] = useState<{
    stage: string;
    current: number;
    total: number;
    estimatedTime: string;
  } | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭所有下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowSubjectDropdown(false);
        setShowGradeDropdown(false);
        setShowStyleDropdown(false);
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOutputTypeToggle = (value: string) => {
    setSelectedOutputTypes((prev) => {
      if (prev.includes(value)) {
        if (prev.length === 1) return prev;
        return prev.filter((v) => v !== value);
      } else {
        return [...prev, value];
      }
    });
  };

  const handleStudentTypeChange = (type: string) => {
    setSelectedStudentType(type);
    const option = STUDENT_TYPE_OPTIONS.find((o) => o.value === type);
    if (option) {
      setFormData((prev) => ({
        ...prev,
        studentInterests: option.template,
      }));
    }
  };

  const handleCourseThemeSelect = (value: string) => {
    const option = COURSE_DESIGN_OPTIONS.find((o) => o.value === value);
    if (option) {
      setFormData((prev) => ({
        ...prev,
        courseTheme: option.template,
      }));
    }
    setShowThemeDropdown(false);
  };

  const handleTeacherStyleSelect = (value: string) => {
    const option = TEACHER_STYLE_OPTIONS.find((o) => o.value === value);
    if (option) {
      setFormData((prev) => ({
        ...prev,
        teacherStyle: option.template,
      }));
    }
    setShowStyleDropdown(false);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${Date.now()}-${i}`;

      setUploadedFiles((prev) => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          type: file.type,
          url: '',
          status: 'uploading',
        },
      ]);

      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!response.ok) {
          throw new Error('上传失败');
        }

        const result = await response.json();

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, url: result.url, status: 'ready' }
              : f
          )
        );
      } catch (error) {
        console.error('上传错误:', error);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'error' } : f
          )
        );
      }
    }

    setIsUploading(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (type === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  // 解析生成的资源
  const parseResources = useCallback((content: string): GeneratedResource[] => {
    const resources: GeneratedResource[] = [];
    const separatorRegex = /<<<RESOURCE_SEPARATOR type="([^"]+)" label="([^"]+)"[^/]*\/>>>/g;
    
    let match;
    let lastIndex = 0;
    const parts: { type: string; label: string; content: string }[] = [];
    
    while ((match = separatorRegex.exec(content)) !== null) {
      if (lastIndex === 0 && match.index > 0) {
        // 第一个分隔符之前的内容（可能是单一资源）
      }
      lastIndex = match.index + match[0].length;
    }
    
    // 重置regex
    separatorRegex.lastIndex = 0;
    
    // 如果没有找到分隔符，说明是单一资源
    if (!separatorRegex.test(content)) {
      if (selectedOutputTypes.length === 1) {
        const type = selectedOutputTypes[0];
        const label = OUTPUT_TYPE_OPTIONS.find(o => o.value === type)?.label || type;
        return [{ type, label, content: content.trim() }];
      }
      return [];
    }
    
    // 重置regex
    separatorRegex.lastIndex = 0;
    
    // 解析多资源
    const matches = [...content.matchAll(separatorRegex)];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const type = match[1];
      const label = match[2];
      const startIndex = match.index! + match[0].length;
      const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;
      const resourceContent = content.slice(startIndex, endIndex).trim();
      
      resources.push({ type, label, content: resourceContent });
    }
    
    return resources;
  }, [selectedOutputTypes]);

  // 导出为Markdown文件
  const exportToMarkdown = useCallback((resource?: GeneratedResource) => {
    const content = resource?.content || generatedContent;
    if (!content) return;
    
    const fileName = resource ? `${resource.label}.md` : '教学资源.md';
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedContent]);

  // 导出为HTML文件（可在Word中打开）
  const exportToHTML = useCallback((resource?: GeneratedResource) => {
    const content = resource?.content || generatedContent;
    if (!content) return;
    
    // 简单的Markdown转HTML
    const htmlContent = content
      .replace(/^### (.*$)/gm, '<h3 style="font-size:16px;font-weight:bold;margin:15px 0 10px;">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 style="font-size:18px;font-weight:bold;margin:18px 0 12px;">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 style="font-size:24px;font-weight:bold;margin:20px 0 15px;border-bottom:2px solid #333;padding-bottom:10px;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li style="margin:5px 0;">$1</li>')
      .replace(/\n\n/g, '</p><p style="margin:8px 0;line-height:1.6;">')
      .replace(/\n/g, '<br>');
    
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${resource?.label || '教学资源'}</title>
  <style>
    body { font-family: "Microsoft YaHei", sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.8; }
    h1 { font-size: 24px; font-weight: bold; margin: 20px 0 15px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { font-size: 20px; font-weight: bold; margin: 18px 0 12px; }
    h3 { font-size: 16px; font-weight: bold; margin: 15px 0 10px; }
    h4 { font-size: 14px; font-weight: bold; margin: 12px 0 8px; }
    p { margin: 8px 0; line-height: 1.6; }
    ul, ol { margin: 10px 0; padding-left: 25px; }
    li { margin: 5px 0; }
    strong { font-weight: bold; }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
  </style>
</head>
<body>
  <div style="white-space: pre-wrap;">${htmlContent}</div>
</body>
</html>`;
    
    const fileName = resource ? `${resource.label}.html` : '教学资源.html';
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedContent]);

  const handleSubmit = useCallback(async () => {
    const hasContent = formData.textbookContent.trim() || uploadedFiles.length > 0;
    if (!hasContent) {
      alert('请输入教材内容或上传文件');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');

    // 计算预估时间
    const fileCount = uploadedFiles.filter((f) => f.status === 'ready').length;
    const imageCount = uploadedFiles.filter((f) => f.status === 'ready' && f.type.startsWith('image/')).length;
    const typeCount = selectedOutputTypes.length;
    
    // 预估：每张图片识别约10秒，每种输出类型生成约30秒
    const estimatedSeconds = imageCount * 10 + typeCount * 30;
    const estimatedMinutes = Math.ceil(estimatedSeconds / 60);
    
    // 设置初始进度
    setProgressInfo({
      stage: imageCount > 0 ? '正在识别图片...' : '正在生成内容...',
      current: 0,
      total: imageCount + typeCount,
      estimatedTime: estimatedMinutes > 1 ? `约 ${estimatedMinutes} 分钟` : '约 1 分钟',
    });

    try {
      const response = await fetch('/api/generate-lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          outputTypes: selectedOutputTypes,
          files: uploadedFiles
            .filter((f) => f.status === 'ready')
            .map((f) => ({ name: f.name, type: f.type, url: f.url })),
        }),
      });

      if (!response.ok) {
        throw new Error('生成失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应');
      }

      // 更新进度为生成内容阶段
      setProgressInfo((prev) => prev ? {
        ...prev,
        stage: '正在生成教学内容...',
        current: imageCount,
      } : null);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setGeneratedContent((prev) => prev + chunk);

        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      }
      
      // 解析资源
      const finalContent = await new Promise<string>(resolve => {
        setGeneratedContent(prev => {
          resolve(prev);
          return prev;
        });
      });
      
      const resources = parseResources(finalContent);
      setParsedResources(resources);
      if (resources.length > 0) {
        setActiveResourceTab(resources[0].type);
      }
      
      // 完成
      setProgressInfo(null);
    } catch (error) {
      console.error('生成错误:', error);
      setGeneratedContent('生成失败，请重试');
      setProgressInfo(null);
    } finally {
      setIsGenerating(false);
    }
  }, [formData, selectedOutputTypes, uploadedFiles]);

  const hasContent = formData.textbookContent.trim() || uploadedFiles.some(f => f.status === 'ready');

  const getButtonText = () => {
    if (isGenerating) {
      if (progressInfo) {
        return `${progressInfo.stage}（${progressInfo.estimatedTime}）`;
      }
      return '正在生成...';
    }
    if (isUploading) {
      return '正在上传文件...';
    }
    const selectedLabels = selectedOutputTypes.map(
      (t) => OUTPUT_TYPE_OPTIONS.find((o) => o.value === t)?.label
    );
    if (selectedOutputTypes.length === 1) {
      return `生成${selectedLabels[0]}`;
    }
    return `生成 ${selectedOutputTypes.length} 项教学资源`;
  };

  // 下拉选择组件
  const DropdownInput = ({
    label,
    value,
    name,
    options,
    isOpen,
    setIsOpen,
    placeholder,
  }: {
    label: string;
    value: string;
    name: string;
    options: string[];
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    placeholder: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <Input
          name={name}
          value={value}
          onChange={(e) => {
            handleInputChange(e);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="border-border/60 focus:border-primary pr-8"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted/50 rounded"
          onClick={() => setIsOpen(!isOpen)}
        >
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, [name]: option }));
                  setIsOpen(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">教学备课 AI</h1>
            <p className="text-sm text-muted-foreground">一键生成多种教学资源</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Input Form */}
          <div className="space-y-6" ref={formRef}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  输入课程信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Output Type Selection - Multi-select */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">输出类型（可多选）</Label>
                  <div className="flex flex-wrap gap-2">
                    {OUTPUT_TYPE_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedOutputTypes.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleOutputTypeToggle(option.value)}
                          className={`relative px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border/50 hover:border-primary/50 hover:bg-muted/30 text-muted-foreground'
                          }`}
                          title={option.description}
                        >
                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                          <Icon className="w-4 h-4" />
                          <span className="text-sm">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    已选择 {selectedOutputTypes.length} 项：{selectedOutputTypes.map(t => OUTPUT_TYPE_OPTIONS.find(o => o.value === t)?.label).join('、')}
                  </p>
                </div>

                {/* Subject & Grade with Dropdown */}
                <div className="grid grid-cols-2 gap-4">
                  <DropdownInput
                    label="学科"
                    value={formData.subject}
                    name="subject"
                    options={SUBJECT_OPTIONS}
                    isOpen={showSubjectDropdown}
                    setIsOpen={setShowSubjectDropdown}
                    placeholder="选择或输入学科"
                  />
                  <DropdownInput
                    label="年级"
                    value={formData.grade}
                    name="grade"
                    options={GRADE_OPTIONS}
                    isOpen={showGradeDropdown}
                    setIsOpen={setShowGradeDropdown}
                    placeholder="选择或输入年级"
                  />
                </div>

                {/* Course Theme / Design Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4 text-muted-foreground" />
                    课程主题/设计类型
                  </Label>
                  <div className="relative">
                    <Textarea
                      name="courseTheme"
                      value={formData.courseTheme}
                      onChange={handleInputChange}
                      onFocus={() => setShowThemeDropdown(true)}
                      placeholder="如：广州花城一日游主题、设计三个探究活动..."
                      rows={2}
                      className="border-border/60 focus:border-primary resize-none"
                    />
                    <button
                      type="button"
                      className="absolute right-2 bottom-2 p-1 hover:bg-muted/50 rounded"
                      onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                    >
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showThemeDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showThemeDropdown && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {COURSE_DESIGN_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                            onClick={() => handleCourseThemeSelect(option.value)}
                          >
                            <div className="text-sm font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {option.template}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Type Quick Select */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    学生类型快速选择
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {STUDENT_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleStudentTypeChange(option.value)}
                        className={`p-3 text-left rounded-lg border transition-all ${
                          selectedStudentType === option.value
                            ? 'border-primary bg-primary/5 text-foreground'
                            : 'border-border/50 hover:border-primary/50 hover:bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs mt-0.5 opacity-70 line-clamp-2">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Student Interests */}
                <div className="space-y-2">
                  <Label htmlFor="studentInterests" className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    学生兴趣特点
                    <span className="text-xs text-muted-foreground font-normal">
                      (可基于上方类型修改)
                    </span>
                  </Label>
                  <Textarea
                    id="studentInterests"
                    name="studentInterests"
                    placeholder="描述学生的兴趣爱好、关注点、认知水平等"
                    value={formData.studentInterests}
                    onChange={handleInputChange}
                    rows={2}
                    className="border-border/60 focus:border-primary resize-none"
                  />
                </div>

                {/* Teacher Style */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">教师风格</Label>
                  <div className="relative">
                    <Textarea
                      name="teacherStyle"
                      value={formData.teacherStyle}
                      onChange={handleInputChange}
                      onFocus={() => setShowStyleDropdown(true)}
                      placeholder="选择或输入教师风格..."
                      rows={2}
                      className="border-border/60 focus:border-primary resize-none"
                    />
                    <button
                      type="button"
                      className="absolute right-2 bottom-2 p-1 hover:bg-muted/50 rounded"
                      onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                    >
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showStyleDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showStyleDropdown && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {TEACHER_STYLE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0"
                            onClick={() => handleTeacherStyleSelect(option.value)}
                          >
                            <div className="text-sm font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {option.template}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* File Upload Area */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    上传教材文件
                    <span className="text-xs text-muted-foreground font-normal">
                      (支持 PDF、图片、Word 等)
                    </span>
                  </Label>
                  
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border/60 hover:border-primary/50 hover:bg-muted/30'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files)}
                    />
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">
                      拖拽文件到此处，或<span className="text-primary">点击上传</span>
                    </p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {uploadedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-muted/40 rounded-lg border border-border/30"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="text-muted-foreground">
                              {getFileIcon(file.type)}
                            </div>
                            <span className="text-sm truncate flex-1">
                              {file.name}
                            </span>
                            {file.status === 'uploading' && (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            )}
                            {file.status === 'ready' && (
                              <Badge variant="secondary" className="text-xs">
                                已就绪
                              </Badge>
                            )}
                            {file.status === 'error' && (
                              <Badge variant="destructive" className="text-xs">
                                上传失败
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Textbook Content */}
                <div className="space-y-2">
                  <Label htmlFor="textbookContent" className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    教材内容
                  </Label>
                  <Textarea
                    id="textbookContent"
                    name="textbookContent"
                    placeholder="粘贴或输入本课的教材内容、教学目标、重难点等..."
                    value={formData.textbookContent}
                    onChange={handleInputChange}
                    rows={4}
                    className="border-border/60 focus:border-primary resize-none"
                  />
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isGenerating || isUploading || !hasContent}
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  {isGenerating || isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {getButtonText()}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      {getButtonText()}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Tips */}
            <div className="bg-muted/50 rounded-xl p-4 border border-border/30">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <span className="text-primary">💡</span> 使用提示
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 课程主题可自定义创意设计，如"花城一日游"</li>
                <li>• 可多选输出类型，一次性生成多种教学资源</li>
                <li>• 游戏活动设计会自动加入未成年人保护措施</li>
                <li>• 支持上传 PDF、图片、Word 等格式文件</li>
              </ul>
              {(uploadedFiles.filter(f => f.status === 'ready').length > 3 || selectedOutputTypes.length > 2) && (
                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ 生成时间提示：
                    {uploadedFiles.filter(f => f.status === 'ready').length > 3 && (
                      <span> 上传 {uploadedFiles.filter(f => f.status === 'ready').length} 个文件需要较长时间处理；</span>
                    )}
                    {selectedOutputTypes.length > 2 && (
                      <span> 生成 {selectedOutputTypes.length} 种输出类型需要约 {selectedOutputTypes.length * 30} 秒。</span>
                    )}
                    建议减少文件数量或输出类型以加快速度。
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Output */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-lg">生成结果</CardTitle>
                  {generatedContent && !isGenerating && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToMarkdown(parsedResources.find(r => r.type === activeResourceTab))}
                        title="导出为Markdown文件"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        导出MD
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToHTML(parsedResources.find(r => r.type === activeResourceTab))}
                        title="导出为HTML文件（可用Word打开）"
                      >
                        <FileDown className="w-4 h-4 mr-1" />
                        导出HTML
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            parsedResources.find(r => r.type === activeResourceTab)?.content || generatedContent
                          );
                          alert('已复制到剪贴板');
                        }}
                      >
                        复制内容
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* 使用Tab展示多资源 */}
                {parsedResources.length > 1 && !isGenerating ? (
                  <Tabs value={activeResourceTab} onValueChange={setActiveResourceTab} className="w-full">
                    <TabsList className="w-full justify-start mb-4 bg-muted/50 h-auto flex-wrap gap-1 p-1">
                      {parsedResources.map((resource) => {
                        const Icon = OUTPUT_TYPE_OPTIONS.find(o => o.value === resource.type)?.icon || FileText;
                        return (
                          <TabsTrigger 
                            key={resource.type} 
                            value={resource.type}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5"
                          >
                            <Icon className="w-4 h-4 mr-1" />
                            {resource.label}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                    {parsedResources.map((resource) => (
                      <TabsContent key={resource.type} value={resource.type} className="mt-0">
                        <div className="min-h-[500px] max-h-[calc(100vh-300px)] overflow-y-auto bg-white dark:bg-muted/20 rounded-lg border border-border/30">
                          <div className="p-6">
                            <SimpleMarkdown content={resource.content} />
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : (
                  <div
                    ref={outputRef}
                    className="min-h-[500px] max-h-[calc(100vh-220px)] overflow-y-auto bg-white dark:bg-muted/20 rounded-lg border border-border/30"
                  >
                    {!generatedContent && !isGenerating ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                          <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground">
                          输入教材内容后点击生成
                        </p>
                        <p className="text-sm text-muted-foreground/60 mt-1">
                          将生成 {selectedOutputTypes.length} 项教学资源
                        </p>
                      </div>
                    ) : isGenerating && !generatedContent ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                        {progressInfo && (
                          <>
                            <p className="text-foreground font-medium mb-2">
                              {progressInfo.stage}
                            </p>
                            <div className="w-64 h-2 bg-muted rounded-full overflow-hidden mb-3">
                              <div 
                                className="h-full bg-primary transition-all duration-300"
                                style={{ 
                                  width: `${progressInfo.total > 0 
                                    ? Math.min((progressInfo.current / progressInfo.total) * 100, 90) 
                                    : 0}%` 
                                }}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              预计需要 {progressInfo.estimatedTime}
                            </p>
                            {uploadedFiles.filter(f => f.status === 'ready' && f.type.startsWith('image/')).length > 0 && (
                              <p className="text-xs text-muted-foreground/60 mt-2">
                                已上传 {uploadedFiles.filter(f => f.status === 'ready').length} 个文件需要处理
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="p-6">
                        <SimpleMarkdown content={generatedContent} />
                        {isGenerating && (
                          <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Click outside to close dropdowns */}
      {(showSubjectDropdown || showGradeDropdown || showStyleDropdown || showThemeDropdown) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowSubjectDropdown(false);
            setShowGradeDropdown(false);
            setShowStyleDropdown(false);
            setShowThemeDropdown(false);
          }}
        />
      )}
    </div>
  );
}
