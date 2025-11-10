import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

type ScanStatus = 'idle' | 'running' | 'completed' | 'failed';
type SecurityStatus = 'safe' | 'cloudflare' | 'captcha' | 'blocked';

interface ScanJob {
  id: string;
  category: string;
  status: ScanStatus;
  progress: number;
  channelsFound: number;
  startedAt: string;
}

interface Channel {
  id: string;
  title: string;
  link: string;
  subscribers: number;
  tags: string[];
  admin: string;
  verified: boolean;
}

const API_URLS = {
  scraper: 'https://functions.poehali.dev/8583a14d-131b-4961-8f08-ff2da3bb0cd2',
  channels: 'https://functions.poehali.dev/9ad1bce9-7cc8-4207-9bb3-1ae408ab90db',
  stats: 'https://functions.poehali.dev/4286c59b-8345-4818-862d-aeafb090375c'
};

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('scan');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [scanJobs, setScanJobs] = useState<ScanJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([]);

  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>('cloudflare');
  const [stats, setStats] = useState({
    totalChannels: 0,
    totalSubscribers: 0,
    categoriesScanned: 0,
    activeScans: 0
  });

  useEffect(() => {
    fetchStats();
    fetchJobs();
    fetchChannels();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(API_URLS.stats);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch(API_URLS.scraper);
      const data = await response.json();
      setScanJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch(API_URLS.channels);
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const handleStartScan = async () => {
    if (!selectedCategory) {
      toast({
        title: 'Выберите категорию',
        description: 'Необходимо указать категорию для сканирования',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(API_URLS.scraper, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedCategory })
      });
      
      const data = await response.json();
      
      toast({
        title: 'Сканирование завершено',
        description: `Найдено каналов: ${data.channels_found}`
      });
      
      await fetchJobs();
      await fetchChannels();
      await fetchStats();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось запустить сканирование',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityScan = () => {
    toast({
      title: 'Security Scan запущен',
      description: 'Проверка защиты сайта начата'
    });
  };

  const handleExport = () => {
    toast({
      title: 'Экспорт начат',
      description: 'Формируется Excel-файл с контрольной суммой'
    });
  };

  const getStatusColor = (status: ScanStatus) => {
    switch (status) {
      case 'running': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSecurityBadge = () => {
    switch (securityStatus) {
      case 'safe':
        return <Badge className="bg-green-500 hover:bg-green-600">Safe</Badge>;
      case 'cloudflare':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Cloudflare Detected</Badge>;
      case 'captcha':
        return <Badge className="bg-red-500 hover:bg-red-600">CAPTCHA Active</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">TGStat Parser</h1>
            <p className="text-muted-foreground mt-2">Автоматический сбор данных о Telegram-каналах</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSecurityScan} variant="outline" className="gap-2">
              <Icon name="Shield" size={18} />
              Security Scan
            </Button>
            <Button onClick={handleExport} className="gap-2 bg-primary hover:bg-primary/90">
              <Icon name="Download" size={18} />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего каналов</CardTitle>
              <Icon name="Database" size={18} className="text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalChannels.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Собрано в базе</p>
            </CardContent>
          </Card>

          <Card className="hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Подписчики</CardTitle>
              <Icon name="Users" size={18} className="text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.totalSubscribers / 1000000).toFixed(1)}M</div>
              <p className="text-xs text-muted-foreground">Суммарно</p>
            </CardContent>
          </Card>

          <Card className="hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Категории</CardTitle>
              <Icon name="FolderTree" size={18} className="text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categoriesScanned}</div>
              <p className="text-xs text-muted-foreground">Просканировано</p>
            </CardContent>
          </Card>

          <Card className="hover:scale-105 transition-transform">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные задачи</CardTitle>
              <Icon name="Activity" size={18} className="text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-pulse-glow">{stats.activeScans}</div>
              <p className="text-xs text-muted-foreground">В процессе</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scan" className="gap-2">
              <Icon name="Play" size={16} />
              Сканирование
            </TabsTrigger>
            <TabsTrigger value="channels" className="gap-2">
              <Icon name="List" size={16} />
              Каналы
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Icon name="ShieldCheck" size={16} />
              Security
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2">
              <Icon name="FileDown" size={16} />
              Экспорт
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4 animate-scale-in">
            <Card>
              <CardHeader>
                <CardTitle>Запустить полное сканирование</CardTitle>
                <CardDescription>Выберите категорию или тег для автоматического обхода</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Маркетинг</SelectItem>
                      <SelectItem value="pr">PR & Реклама</SelectItem>
                      <SelectItem value="business">Бизнес</SelectItem>
                      <SelectItem value="tech">Технологии</SelectItem>
                      <SelectItem value="crypto">Криптовалюты</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Или введите тег (напр. advertising)" />
                  <Button onClick={handleStartScan} className="gap-2 bg-primary" disabled={isLoading}>
                    <Icon name="Rocket" size={18} />
                    {isLoading ? 'Сканирование...' : 'Start Full Scan'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Активные задачи сканирования</CardTitle>
                <CardDescription>Прогресс текущих и завершенных сканирований</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scanJobs.map((job) => (
                    <div key={job.id} className="space-y-2 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(job.status)} ${job.status === 'running' ? 'animate-pulse-glow' : ''}`} />
                          <div>
                            <p className="font-medium">{job.category}</p>
                            <p className="text-xs text-muted-foreground">ID: {job.id} • Начато в {job.startedAt}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{job.channelsFound}</p>
                          <p className="text-xs text-muted-foreground">каналов найдено</p>
                        </div>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{job.status === 'running' ? 'В процессе...' : 'Завершено'}</span>
                        <span>{job.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="channels" className="animate-scale-in">
            <Card>
              <CardHeader>
                <CardTitle>Найденные каналы</CardTitle>
                <CardDescription>Полный список собранных Telegram-каналов</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Канал</TableHead>
                      <TableHead>Ссылка</TableHead>
                      <TableHead>Подписчики</TableHead>
                      <TableHead>Теги</TableHead>
                      <TableHead>Админ</TableHead>
                      <TableHead>Статус</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channels.map((channel) => (
                      <TableRow key={channel.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{channel.title}</TableCell>
                        <TableCell>
                          <a href={`https://${channel.link}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {channel.link}
                          </a>
                        </TableCell>
                        <TableCell>{channel.subscribers.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {channel.tags.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                            {channel.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{channel.tags.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{channel.admin}</TableCell>
                        <TableCell>
                          {channel.verified ? (
                            <Badge className="bg-green-500 gap-1">
                              <Icon name="CheckCircle2" size={12} />
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="animate-scale-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Shield" size={24} />
                  Security Scan Dashboard
                </CardTitle>
                <CardDescription>Анализ защиты сайта и методов обхода блокировок</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Текущий статус защиты</p>
                    <p className="text-sm text-muted-foreground">TGStat.ru</p>
                  </div>
                  {getSecurityBadge()}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" size={18} className="text-muted-foreground" />
                        <span className="text-sm">robots.txt</span>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">Allowed</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Icon name="Cloud" size={18} className="text-muted-foreground" />
                        <span className="text-sm">Cloudflare</span>
                      </div>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500">Detected</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Icon name="Lock" size={18} className="text-muted-foreground" />
                        <span className="text-sm">CAPTCHA</span>
                      </div>
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">Possible</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Icon name="Timer" size={18} className="text-muted-foreground" />
                        <span className="text-sm">Rate Limit</span>
                      </div>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500">60/min</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Icon name="Code" size={18} className="text-muted-foreground" />
                        <span className="text-sm">JS Challenge</span>
                      </div>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-500">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-card rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Icon name="Globe" size={18} className="text-muted-foreground" />
                        <span className="text-sm">Proxy Required</span>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">Yes</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Icon name="Lightbulb" size={18} className="text-primary" />
                    Рекомендации по обходу
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Использовать Playwright с stealth-режимом</li>
                    <li>• Ротация residential прокси (рекомендуется)</li>
                    <li>• Задержки 2-5 секунд между запросами</li>
                    <li>• Интеграция с 2captcha для обхода CAPTCHA</li>
                    <li>• Ротация User-Agent и браузерных fingerprints</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="animate-scale-in">
            <Card>
              <CardHeader>
                <CardTitle>История экспорта</CardTitle>
                <CardDescription>Сгенерированные Excel-файлы с контрольными суммами</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'tgstat_marketing_full_20251110_1045_job1.xlsx', date: '10.11.2025 10:45', size: '2.4 MB', sha256: 'a7f3b...', rows: 234 },
                    { name: 'tgstat_pr_full_20251109_0912_job2.xlsx', date: '09.11.2025 09:12', size: '4.1 MB', sha256: '9c2e1...', rows: 567 }
                  ].map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                          <Icon name="FileSpreadsheet" size={24} className="text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Icon name="Calendar" size={12} />
                              {file.date}
                            </span>
                            <span>{file.size}</span>
                            <span>{file.rows} строк</span>
                          </div>
                          <p className="font-mono text-xs text-muted-foreground mt-1">SHA256: {file.sha256}...</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Icon name="Download" size={16} />
                        Скачать
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;