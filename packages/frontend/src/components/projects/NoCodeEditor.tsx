import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

// Define the schema for the No-Code editor content
const noCodePageContentSchema = z.object({
  title: z.string().min(1, '페이지 제목을 입력해주세요.'),
  heading: z.string().min(1, '제목을 입력해주세요.'),
  body: z.string().min(1, '본문 내용을 입력해주세요.'),
  imageUrl: z.string().url('유효한 이미지 URL을 입력해주세요.').optional().or(z.literal('')),
});

type NoCodePageContentForm = z.infer<typeof noCodePageContentSchema>;

interface NoCodeEditorProps {
  projectId: string;
  initialContent: Record<string, any>;
  onSave: (content: Record<string, any>) => Promise<void>;
}

const NoCodeEditor: React.FC<NoCodeEditorProps> = ({ projectId, initialContent, onSave }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NoCodePageContentForm>({
    resolver: zodResolver(noCodePageContentSchema),
    defaultValues: {
      title: initialContent.title || '',
      heading: initialContent.heading || '',
      body: initialContent.body || '',
      imageUrl: initialContent.imageUrl || '',
    },
  });

  const onSubmit = async (data: NoCodePageContentForm) => {
    try {
      await onSave(data);
      // TODO: Add a proper toast notification system
      console.log('페이지 내용이 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('Failed to save page content:', error);
      // TODO: Add a proper toast notification system
      console.error('페이지 내용 업데이트에 실패했습니다.');
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">페이지 편집기</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">페이지 제목</Label>
          <Input id="title" {...register('title')} />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="heading">메인 제목</Label>
          <Input id="heading" {...register('heading')} />
          {errors.heading && <p className="text-red-500 text-sm mt-1">{errors.heading.message}</p>}
        </div>
        <div>
          <Label htmlFor="body">본문 내용</Label>
          <Textarea id="body" {...register('body')} rows={5} />
          {errors.body && <p className="text-red-500 text-sm mt-1">{errors.body.message}</p>}
        </div>
        <div>
          <Label htmlFor="imageUrl">이미지 URL (선택 사항)</Label>
          <Input id="imageUrl" type="url" {...register('imageUrl')} />
          {errors.imageUrl && <p className="text-red-500 text-sm mt-1">{errors.imageUrl.message}</p>}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : '변경 사항 저장'}
        </Button>
      </form>
    </Card>
  );
};

export default NoCodeEditor;
