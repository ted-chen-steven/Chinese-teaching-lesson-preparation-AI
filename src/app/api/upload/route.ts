import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 检查文件大小 (最大 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: '文件大小不能超过 20MB' }, { status: 400 });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 初始化 S3 存储
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    // 生成安全的文件名
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `teaching-files/${timestamp}_${safeName}`;

    // 上传文件
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type || 'application/octet-stream',
    });

    // 生成签名 URL (有效期 1 小时)
    const signedUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 3600,
    });

    return NextResponse.json({
      success: true,
      url: signedUrl,
      key: fileKey,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '文件上传失败，请重试' },
      { status: 500 }
    );
  }
}
