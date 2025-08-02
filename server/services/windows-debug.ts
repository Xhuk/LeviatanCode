import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as process from 'process';

const execAsync = promisify(exec);

interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  hostname: string;
  uptime: string;
  loadAverage: number[];
  cpuCores: number;
  totalMemory: string;
  freeMemory: string;
  diskUsage: string;
}

interface Process {
  pid: number;
  name: string;
  cpu: number;
  memory: string;
  user: string;
  status: string;
}

interface EnvironmentVariable {
  name: string;
  value: string;
  sensitive: boolean;
}

export class WindowsDebugService {
  private static instance: WindowsDebugService;

  public static getInstance(): WindowsDebugService {
    if (!WindowsDebugService.instance) {
      WindowsDebugService.instance = new WindowsDebugService();
    }
    return WindowsDebugService.instance;
  }

  private constructor() {}

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  private isSensitiveVariable(name: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /key/i,
      /token/i,
      /auth/i,
      /credential/i,
      /private/i,
      /api_key/i,
      /access_token/i,
      /session/i,
      /cookie/i
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(name));
  }

  public async getSystemInfo(): Promise<SystemInfo> {
    try {
      const platform = os.platform();
      const arch = os.arch();
      const hostname = os.hostname();
      const uptime = this.formatUptime(os.uptime());
      const loadAverage = os.loadavg();
      const cpuCores = os.cpus().length;
      
      const totalMemory = this.formatBytes(os.totalmem());
      const freeMemory = this.formatBytes(os.freemem());
      
      // Get OS version
      let version = os.release();
      try {
        if (platform === 'win32') {
          const { stdout } = await execAsync('ver');
          version = stdout.trim();
        } else if (platform === 'linux') {
          try {
            const { stdout } = await execAsync('lsb_release -d');
            version = stdout.replace('Description:', '').trim();
          } catch {
            const { stdout } = await execAsync('cat /etc/os-release | grep PRETTY_NAME');
            version = stdout.split('=')[1]?.replace(/"/g, '').trim() || version;
          }
        } else if (platform === 'darwin') {
          const { stdout } = await execAsync('sw_vers -productVersion');
          version = `macOS ${stdout.trim()}`;
        }
      } catch (error) {
        console.log('Could not get detailed OS version:', error);
      }

      // Get disk usage
      let diskUsage = 'Unknown';
      try {
        if (platform === 'win32') {
          const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption /format:csv');
          const lines = stdout.split('\n').filter(line => line.includes(','));
          if (lines.length > 1) {
            const diskData = lines[1].split(',');
            if (diskData.length >= 4) {
              const free = parseInt(diskData[2]) || 0;
              const total = parseInt(diskData[3]) || 0;
              const used = total - free;
              const usedPercent = total > 0 ? ((used / total) * 100).toFixed(1) : '0';
              diskUsage = `${this.formatBytes(used)} / ${this.formatBytes(total)} (${usedPercent}%)`;
            }
          }
        } else {
          const { stdout } = await execAsync('df -h / | tail -1');
          const parts = stdout.split(/\s+/);
          if (parts.length >= 5) {
            diskUsage = `${parts[2]} / ${parts[1]} (${parts[4]})`;
          }
        }
      } catch (error) {
        console.log('Could not get disk usage:', error);
      }

      return {
        platform,
        arch,
        version,
        hostname,
        uptime,
        loadAverage,
        cpuCores,
        totalMemory,
        freeMemory,
        diskUsage
      };
    } catch (error) {
      console.error('Error getting system info:', error);
      throw new Error('Failed to retrieve system information');
    }
  }

  public async getProcesses(): Promise<Process[]> {
    try {
      const platform = os.platform();
      let processes: Process[] = [];

      if (platform === 'win32') {
        // Windows: Use tasklist command
        try {
          const { stdout } = await execAsync('tasklist /fo csv');
          const lines = stdout.split('\n').slice(1); // Skip header
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            const parts = line.split('","').map(part => part.replace(/"/g, ''));
            if (parts.length >= 5) {
              const pid = parseInt(parts[1]);
              const name = parts[0];
              const memory = parts[4];
              
              processes.push({
                pid,
                name,
                cpu: 0, // tasklist doesn't provide CPU usage directly
                memory,
                user: parts[2] || 'Unknown',
                status: 'running'
              });
            }
          }
        } catch (error) {
          console.log('Windows tasklist failed, using fallback');
        }
      } else {
        // Unix-like systems: Use ps command
        try {
          const { stdout } = await execAsync('ps aux');
          const lines = stdout.split('\n').slice(1); // Skip header
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 11) {
              const pid = parseInt(parts[1]);
              const cpu = parseFloat(parts[2]);
              const memPercent = parseFloat(parts[3]);
              const user = parts[0];
              const command = parts.slice(10).join(' ');
              
              processes.push({
                pid,
                name: command.split(' ')[0],
                cpu,
                memory: `${memPercent.toFixed(1)}%`,
                user,
                status: 'running'
              });
            }
          }
        } catch (error) {
          console.log('Unix ps command failed');
        }
      }

      // If no processes found through system commands, get at least the current process
      if (processes.length === 0) {
        processes.push({
          pid: process.pid,
          name: 'node',
          cpu: 0,
          memory: this.formatBytes(process.memoryUsage().rss),
          user: os.userInfo().username,
          status: 'running'
        });
      }

      // Sort by PID and limit to reasonable number
      return processes.sort((a, b) => a.pid - b.pid).slice(0, 50);
    } catch (error) {
      console.error('Error getting processes:', error);
      throw new Error('Failed to retrieve process information');
    }
  }

  public async getEnvironmentVariables(): Promise<EnvironmentVariable[]> {
    try {
      const envVars: EnvironmentVariable[] = [];
      
      for (const [name, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          envVars.push({
            name,
            value,
            sensitive: this.isSensitiveVariable(name)
          });
        }
      }

      // Sort by name
      return envVars.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error getting environment variables:', error);
      throw new Error('Failed to retrieve environment variables');
    }
  }

  public async killProcess(pid: number): Promise<{ success: boolean; error?: string }> {
    try {
      const platform = os.platform();
      
      if (platform === 'win32') {
        // Windows: Use taskkill command
        await execAsync(`taskkill /F /PID ${pid}`);
      } else {
        // Unix-like systems: Use kill command
        await execAsync(`kill -9 ${pid}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error killing process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false, 
        error: `Failed to kill process ${pid}: ${errorMessage}` 
      };
    }
  }

  public async runCommand(command: string, shell: 'cmd' | 'powershell' | 'bash' = 'cmd'): Promise<{ output: string; error?: string }> {
    try {
      let actualCommand = command;
      
      if (os.platform() === 'win32') {
        if (shell === 'powershell') {
          actualCommand = `powershell.exe -Command "${command}"`;
        } else if (shell === 'cmd') {
          actualCommand = `cmd.exe /c "${command}"`;
        }
      } else {
        // Unix-like systems
        actualCommand = command;
      }

      const { stdout, stderr } = await execAsync(actualCommand, { 
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });
      
      if (stderr && stderr.trim()) {
        return { output: stdout, error: stderr };
      }
      
      return { output: stdout };
    } catch (error) {
      console.error('Error running command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        output: '', 
        error: `Command execution failed: ${errorMessage}` 
      };
    }
  }

  public async getSystemHealth(): Promise<{ status: 'healthy' | 'warning' | 'critical'; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Check memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
      
      if (memUsagePercent > 90) {
        issues.push(`High memory usage: ${memUsagePercent.toFixed(1)}%`);
      } else if (memUsagePercent > 80) {
        issues.push(`Elevated memory usage: ${memUsagePercent.toFixed(1)}%`);
      }

      // Check load average (Unix-like systems only)
      if (os.platform() !== 'win32') {
        const loadAvg = os.loadavg();
        const cpuCores = os.cpus().length;
        
        if (loadAvg[0] > cpuCores * 2) {
          issues.push(`High CPU load: ${loadAvg[0].toFixed(2)} (${cpuCores} cores)`);
        }
      }

      // Check uptime (if too low, might indicate recent crashes)
      const uptime = os.uptime();
      if (uptime < 300) { // Less than 5 minutes
        issues.push(`System recently restarted (uptime: ${Math.floor(uptime)}s)`);
      }

      // Determine overall status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (issues.length > 0) {
        status = issues.some(issue => issue.includes('High') || issue.includes('critical')) ? 'critical' : 'warning';
      }

      return { status, issues };
    } catch (error) {
      return { 
        status: 'critical', 
        issues: ['Failed to assess system health'] 
      };
    }
  }
}