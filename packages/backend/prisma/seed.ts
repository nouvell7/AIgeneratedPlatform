import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@aiplatform.com' },
    update: {},
    create: {
      email: 'admin@aiplatform.com',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      settings: JSON.stringify({
        notifications: { email: true, push: true },
        privacy: { profilePublic: true, projectsPublic: true },
      }),
    },
  });

  // Create demo user
  const demoPasswordHash = await bcrypt.hash('demo123!', 12);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'demo_user',
      passwordHash: demoPasswordHash,
      role: 'USER',
      settings: JSON.stringify({
        notifications: { email: true, push: false },
        privacy: { profilePublic: true, projectsPublic: true },
      }),
    },
  });

  // Create sample templates
  const templates = [
    {
      name: '이미지 분류 서비스',
      description: 'Teachable Machine을 사용한 간단한 이미지 분류 웹 서비스입니다.',
      category: 'image-classification',
      difficulty: 'BEGINNER',
      tags: JSON.stringify(['teachable-machine', 'image', 'classification', 'beginner']),
      codeTemplate: `
<!DOCTYPE html>
<html>
<head>
    <title>이미지 분류 서비스</title>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js"></script>
</head>
<body>
    <h1>AI 이미지 분류</h1>
    <div>
        <input type="file" id="imageInput" accept="image/*">
        <div id="result"></div>
    </div>
    <script>
        // 모델 URL을 여기에 입력하세요
        const modelURL = 'YOUR_MODEL_URL_HERE';
        
        let model;
        
        async function loadModel() {
            model = await tmImage.load(modelURL + 'model.json', modelURL + 'metadata.json');
        }
        
        async function predict(imageElement) {
            const prediction = await model.predict(imageElement);
            return prediction;
        }
        
        loadModel();
    </script>
</body>
</html>`,
      aiModelType: 'teachable-machine',
      previewImages: JSON.stringify(['/templates/image-classification-preview.jpg']),
      usageCount: 0,
      rating: 4.5,
    },
    {
      name: '텍스트 감정 분석',
      description: 'Hugging Face 모델을 사용한 텍스트 감정 분석 서비스입니다.',
      category: 'text-analysis',
      difficulty: 'INTERMEDIATE',
      tags: JSON.stringify(['huggingface', 'text', 'sentiment', 'nlp']),
      codeTemplate: `
<!DOCTYPE html>
<html>
<head>
    <title>텍스트 감정 분석</title>
</head>
<body>
    <h1>텍스트 감정 분석</h1>
    <div>
        <textarea id="textInput" placeholder="분석할 텍스트를 입력하세요..."></textarea>
        <button onclick="analyzeText()">분석하기</button>
        <div id="result"></div>
    </div>
    <script>
        async function analyzeText() {
            const text = document.getElementById('textInput').value;
            // API 호출 로직
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const result = await response.json();
            document.getElementById('result').innerHTML = JSON.stringify(result, null, 2);
        }
    </script>
</body>
</html>`,
      aiModelType: 'huggingface',
      previewImages: JSON.stringify(['/templates/sentiment-analysis-preview.jpg']),
      usageCount: 0,
      rating: 4.2,
    },
    {
      name: '음성 인식 서비스',
      description: '브라우저 Web Speech API를 활용한 음성 인식 서비스입니다.',
      category: 'audio-recognition',
      difficulty: 'ADVANCED',
      tags: JSON.stringify(['speech', 'audio', 'recognition', 'web-api']),
      codeTemplate: `
<!DOCTYPE html>
<html>
<head>
    <title>음성 인식 서비스</title>
</head>
<body>
    <h1>음성 인식</h1>
    <div>
        <button id="startBtn">음성 인식 시작</button>
        <button id="stopBtn">중지</button>
        <div id="result"></div>
    </div>
    <script>
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'ko-KR';
        recognition.continuous = true;
        
        document.getElementById('startBtn').onclick = () => recognition.start();
        document.getElementById('stopBtn').onclick = () => recognition.stop();
        
        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            document.getElementById('result').innerHTML += '<p>' + transcript + '</p>';
        };
    </script>
</body>
</html>`,
      aiModelType: 'custom',
      previewImages: JSON.stringify(['/templates/speech-recognition-preview.jpg']),
      usageCount: 0,
      rating: 4.0,
    },
  ];

  for (const template of templates) {
    await prisma.template.create({
      data: template,
    });
  }

  // Create sample project for demo user
  const sampleProject = await prisma.project.create({
    data: {
      userId: demoUser.id,
      name: '내 첫 번째 AI 서비스',
      description: '이미지 분류를 위한 간단한 AI 서비스입니다.',
      category: 'image-classification',
      status: 'DEVELOPING',
      aiModel: JSON.stringify({
        type: 'teachable-machine',
        modelUrl: 'https://teachablemachine.withgoogle.com/models/example/',
        modelId: 'example-model-id',
        configuration: {
          classes: ['고양이', '강아지', '새'],
          imageSize: 224,
        },
      }),
      revenue: JSON.stringify({
        adsenseEnabled: false,
        adsensePublisherId: null,
        adUnits: [],
      }),
    },
  });

  // Create sample community posts
  const samplePosts = [
    {
      userId: demoUser.id,
      projectId: sampleProject.id,
      type: 'SHOWCASE',
      title: '첫 번째 AI 이미지 분류 서비스 완성!',
      content: '드디어 첫 번째 AI 서비스를 완성했습니다. Teachable Machine으로 고양이와 강아지를 구분하는 서비스를 만들었어요. 생각보다 정확도가 높아서 놀랐습니다!',
      tags: JSON.stringify(['showcase', 'teachable-machine', 'image-classification']),
    },
    {
      userId: admin.id,
      type: 'DISCUSSION',
      title: 'AI 서비스 수익화 전략에 대해 논의해봐요',
      content: 'AI 서비스로 수익을 창출하는 다양한 방법들에 대해 이야기해보면 좋을 것 같습니다. 광고 외에도 어떤 방법들이 있을까요?',
      tags: JSON.stringify(['discussion', 'monetization', 'strategy']),
    },
    {
      userId: demoUser.id,
      type: 'QUESTION',
      title: 'Teachable Machine 모델 정확도를 높이는 방법?',
      content: '모델 학습 시 정확도를 높이기 위한 팁이 있다면 공유해주세요. 특히 이미지 데이터 전처리 관련해서 궁금합니다.',
      tags: JSON.stringify(['question', 'teachable-machine', 'accuracy']),
    },
  ];

  for (const post of samplePosts) {
    await prisma.communityPost.create({
      data: post,
    });
  }

  // Create sample success stories
  const successStories = [
    {
      title: '반려동물 품종 분류 서비스로 월 $500 수익 달성',
      description: '간단한 반려동물 품종 분류 서비스를 만들어 AdSense 광고로 월 $500의 수익을 올리고 있습니다.',
      category: 'image-classification',
      revenue: JSON.stringify({
        monthly: 500,
        currency: 'USD',
        sources: ['adsense'],
      }),
      metrics: JSON.stringify({
        monthlyVisitors: 15000,
        conversionRate: 0.03,
        averageSessionDuration: '2:30',
      }),
      tips: JSON.stringify([
        '고품질 학습 데이터 수집이 가장 중요합니다',
        '사용자 친화적인 UI/UX 디자인에 신경쓰세요',
        'SEO 최적화로 자연 유입을 늘리세요',
        '소셜 미디어 마케팅을 활용하세요',
      ]),
      imageUrl: '/success-stories/pet-classifier.jpg',
    },
    {
      title: '식물 질병 진단 서비스로 농업 분야 진출',
      description: '농업 분야의 식물 질병 진단 AI 서비스를 개발하여 B2B 고객을 확보했습니다.',
      category: 'image-classification',
      revenue: JSON.stringify({
        monthly: 1200,
        currency: 'USD',
        sources: ['subscription', 'api'],
      }),
      metrics: JSON.stringify({
        monthlyVisitors: 5000,
        conversionRate: 0.08,
        averageSessionDuration: '5:45',
      }),
      tips: JSON.stringify([
        '특정 도메인에 특화된 서비스를 만드세요',
        '전문가와 협업하여 정확도를 높이세요',
        'B2B 고객을 타겟으로 하면 더 높은 수익이 가능합니다',
        'API 서비스로 확장하여 수익 모델을 다양화하세요',
      ]),
      imageUrl: '/success-stories/plant-disease.jpg',
    },
  ];

  for (const story of successStories) {
    await prisma.successStory.create({
      data: story,
    });
  }

  console.log('✅ Database seeding completed!');
  console.log(`👤 Admin user: admin@aiplatform.com / admin123!`);
  console.log(`👤 Demo user: demo@example.com / demo123!`);
  console.log(`📝 Created ${templates.length} templates`);
  console.log(`🚀 Created ${samplePosts.length} community posts`);
  console.log(`🏆 Created ${successStories.length} success stories`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });