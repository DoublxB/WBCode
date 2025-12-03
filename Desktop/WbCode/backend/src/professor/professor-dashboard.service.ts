import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

@Injectable()
export class ProfessorDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(user: { id: number; role: Role }) {
    if (![Role.PROFESSOR, Role.ADMIN].includes(user.role)) {
      throw new ForbiddenException('Only professors can access dashboard');
    }
    const totalStudents = await this.prisma.user.count({
      where: { role: { name: Role.STUDENT } }
    });
    const submissions = await this.prisma.submission.count();
    const avgXP = await this.prisma.user.aggregate({
      _avg: { xp: true },
      where: { role: { name: Role.STUDENT } }
    });
    const leaderboard = await this.prisma.leaderboardEntry.findMany({
      orderBy: { xp: 'desc' },
      take: 10,
      include: { user: true }
    });
    return {
      totalStudents,
      totalSubmissions: submissions,
      avgXP: avgXP._avg.xp ?? 0,
      topLearners: leaderboard
    };
  }

  async exportProgressReport(user: { id: number; role: Role }, format: 'csv' | 'pdf' = 'csv') {
    const dashboard = await this.getDashboard(user);
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Save report to database
    await this.prisma.professorReport.create({
      data: {
        professorId: user.id,
        payload: dashboard
      }
    });

    if (format === 'pdf') {
      return this.exportPDF(dashboard, timestamp);
    }
    
    return this.exportCSV(dashboard, timestamp);
  }

  private exportCSV(dashboard: any, timestamp: string): { mime: string; filename: string; data: string } {
    const header = ['Rank', 'Name', 'Email', 'XP', 'Level', 'Streak'];
    const rows = dashboard.topLearners.map((entry: any) => [
      entry.rank,
      `"${entry.user.firstName} ${entry.user.lastName}"`,
      entry.user.email,
      entry.xp,
      entry.user.level || 1,
      entry.user.streak || 0
    ]);

    // Add summary section
    const summary = [
      '',
      'Summary',
      `Total Students,${dashboard.totalStudents}`,
      `Total Submissions,${dashboard.totalSubmissions}`,
      `Average XP,${Math.round(dashboard.avgXP)}`
    ];

    const csvContent = [
      `WBCode Progress Report - ${timestamp}`,
      '',
      header.join(','),
      ...rows.map((row: any[]) => row.join(',')),
      ...summary
    ].join('\n');

    return {
      mime: 'text/csv; charset=utf-8',
      filename: `wbcode-report-${timestamp}.csv`,
      data: csvContent
    };
  }

  private exportPDF(dashboard: any, timestamp: string): { mime: string; filename: string; data: string } {
    // Generate HTML for PDF (simplified - in production use a library like puppeteer or pdfkit)
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WBCode Progress Report - ${timestamp}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #3b82f6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #3b82f6; color: white; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    .summary { margin-top: 30px; }
    .summary-item { margin: 10px 0; }
  </style>
</head>
<body>
  <h1>WBCode Progress Report</h1>
  <p>Generated on: ${timestamp}</p>
  
  <h2>Top Learners</h2>
  <table>
    <thead>
      <tr>
        <th>Rank</th>
        <th>Name</th>
        <th>Email</th>
        <th>XP</th>
        <th>Level</th>
        <th>Streak</th>
      </tr>
    </thead>
    <tbody>
      ${dashboard.topLearners.map((entry: any) => `
        <tr>
          <td>${entry.rank}</td>
          <td>${entry.user.firstName} ${entry.user.lastName}</td>
          <td>${entry.user.email}</td>
          <td>${entry.xp}</td>
          <td>${entry.user.level || 1}</td>
          <td>${entry.user.streak || 0}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-item"><strong>Total Students:</strong> ${dashboard.totalStudents}</div>
    <div class="summary-item"><strong>Total Submissions:</strong> ${dashboard.totalSubmissions}</div>
    <div class="summary-item"><strong>Average XP:</strong> ${Math.round(dashboard.avgXP)}</div>
  </div>
</body>
</html>
    `.trim();

    // Return HTML (in production, convert to PDF using puppeteer or similar)
    return {
      mime: 'text/html',
      filename: `wbcode-report-${timestamp}.html`,
      data: html
    };
  }
}


