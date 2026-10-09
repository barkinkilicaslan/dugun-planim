import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Metro web'de `*.web.ts` dosyasını, yerelde `*.ts` dosyasını seçer. `tsc` yalnız birini görür, bu yüzden web
 * dosyasında eksik bir dışa aktarım (ör. yeni bir bildirim işlevi) ancak web'de çalışma anında patlar. Bu test iki
 * dosyanın aynı adları dışa aktardığını kaynak düzeyinde denetler.
 */
const SERVICES = join(__dirname, '..', 'src', 'services');

function exportedNames(file: string): string[] {
  const source = readFileSync(join(SERVICES, file), 'utf8');
  const names = new Set<string>();
  for (const match of source.matchAll(/^export\s+(?:async\s+)?(?:function|const|type|interface|class)\s+(\w+)/gm)) {
    names.add(match[1]);
  }
  return [...names].sort();
}

const pairs = readdirSync(SERVICES)
  .filter((file) => file.endsWith('.web.ts'))
  .map((web) => [web.replace('.web.ts', '.ts'), web] as const);

describe('web ve yerel servis dosyaları aynı dışa aktarımlara sahiptir', () => {
  it('en az bir web uyarlaması vardır (test boşa geçmesin)', () => {
    expect(pairs.length).toBeGreaterThanOrEqual(3);
  });

  it.each(pairs)('%s ↔ %s', (native, web) => {
    expect(exportedNames(web)).toEqual(exportedNames(native));
  });

  it('bildirim web uyarlaması, yedek geri yükleme ve silmenin çağırdığı işlevleri içerir', () => {
    const names = exportedNames('notifications.web.ts');
    for (const required of [
      'getNotificationPermission',
      'cancelAllScheduledReminders',
      'cancelOrphanedReminders',
      'resetNotificationConsent',
      'clearAllNotifications',
    ]) {
      expect(names).toContain(required);
    }
  });
});
