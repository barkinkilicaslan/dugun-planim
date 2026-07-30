import type { TaskItem, TaskPriority } from './models';

interface TaskTemplate {
  category: string;
  title: string;
  description: string;
  monthsBeforeWedding: number;
  priority: TaskPriority;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    category: 'Planlama',
    title: 'Düğün bütçesini netleştirin',
    description: 'Ana bütçe sınırını ve öncelikli kategorileri birlikte belirleyin.',
    monthsBeforeWedding: 12,
    priority: 'high',
  },
  {
    category: 'Mekân',
    title: 'Mekân seçeneklerini değerlendirin',
    description: 'Kapasite, ulaşım, tarih ve sözleşme koşullarını karşılaştırın.',
    monthsBeforeWedding: 11,
    priority: 'high',
  },
  {
    category: 'Davetli',
    title: 'İlk davetli listesini hazırlayın',
    description: 'Her iki tarafın taslak listesini ve tahmini kişi sayılarını birleştirin.',
    monthsBeforeWedding: 10,
    priority: 'medium',
  },
  {
    category: 'Tedarikçi',
    title: 'Fotoğrafçıyla görüşün',
    description: 'Portföy, teslim kapsamı ve yedek ekipman planını sorun.',
    monthsBeforeWedding: 9,
    priority: 'medium',
  },
  {
    category: 'Tedarikçi',
    title: 'Müzik planını oluşturun',
    description: 'Canlı müzik veya DJ seçeneklerini ve teknik ihtiyaçları belirleyin.',
    monthsBeforeWedding: 8,
    priority: 'medium',
  },
  {
    category: 'Kıyafet',
    title: 'Gelinlik ve damatlık planını başlatın',
    description: 'Prova ve değişiklik sürelerini hesaba katarak randevuları planlayın.',
    monthsBeforeWedding: 7,
    priority: 'medium',
  },
  {
    category: 'Davetli',
    title: 'Davetiyeleri son haline getirin',
    description: 'Metin, baskı adedi ve dağıtım yöntemini doğrulayın.',
    monthsBeforeWedding: 5,
    priority: 'medium',
  },
  {
    category: 'Masa',
    title: 'Masa planı taslağını oluşturun',
    description: 'Katılım durumlarına ve mekân kapasitesine göre ilk yerleşimi yapın.',
    monthsBeforeWedding: 2,
    priority: 'medium',
  },
  {
    category: 'Final',
    title: 'Tedarikçi ödemelerini doğrulayın',
    description: 'Vade, bakiye ve ödeme kanallarını sözleşmelerle karşılaştırın.',
    monthsBeforeWedding: 1,
    priority: 'high',
  },
  {
    category: 'Final',
    title: 'Düğün günü zaman çizelgesini paylaşın',
    description: 'Önemli saatleri yakınlar ve tedarikçilerle paylaşın.',
    monthsBeforeWedding: 0,
    priority: 'high',
  },
];

function shiftMonths(dateString: string, months: number): string {
  const wedding = new Date(`${dateString}T12:00:00`);
  wedding.setMonth(wedding.getMonth() - months);
  return wedding.toISOString().slice(0, 10);
}

export function createTemplateTasks(weddingDate: string, idFactory: () => string): TaskItem[] {
  const now = new Date().toISOString();
  return TASK_TEMPLATES.map((template) => ({
    id: idFactory(),
    category: template.category,
    title: template.title,
    description: template.description,
    dueDate: shiftMonths(weddingDate, template.monthsBeforeWedding),
    priority: template.priority,
    completed: false,
    createdAt: now,
    updatedAt: now,
  }));
}
