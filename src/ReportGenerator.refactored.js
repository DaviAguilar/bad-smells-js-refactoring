const REPORT_TYPES = {
  CSV: 'CSV',
  HTML: 'HTML',
};

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  generateReport(reportType, user, items) {
    const normalizedItems = this.normalizeItems(items);
    const visibleItems = this.getItemsVisibleToUser(user, normalizedItems);
    const prioritizedItems = this.markPrioritiesForAdmin(user, visibleItems);
    const total = this.calculateTotal(prioritizedItems);
    const formatter = this.getFormatter(reportType);

    return formatter(user, prioritizedItems, total).trim();
  }

  normalizeItems(items) {
    return items.map((item) => ({ ...item }));
  }

  getItemsVisibleToUser(user, items) {
    if (this.isAdmin(user)) {
      return items;
    }

    if (this.isStandardUser(user)) {
      return items.filter((item) => item.value <= 500);
    }

    return [];
  }

  markPrioritiesForAdmin(user, items) {
    if (!this.isAdmin(user)) {
      return items;
    }

    return items.map((item) => ({
      ...item,
      priority: item.value > 1000,
    }));
  }

  calculateTotal(items) {
    return items.reduce((sum, item) => sum + (item.value ?? 0), 0);
  }

  getFormatter(reportType) {
    const formatters = {
      [REPORT_TYPES.CSV]: this.buildCsvReport.bind(this),
      [REPORT_TYPES.HTML]: this.buildHtmlReport.bind(this),
    };

    return formatters[reportType] ?? (() => '');
  }

  buildCsvReport(user, items, total) {
    const lines = ['ID,NOME,VALOR,USUARIO'];

    for (const item of items) {
      lines.push(`${item.id},${item.name},${item.value},${user.name}`);
    }

    lines.push('', 'Total,,', `${total},,`);

    return lines.join('\n');
  }

  buildHtmlReport(user, items, total) {
    const reportLines = [
      '<html><body>',
      '<h1>Relatório</h1>',
      `<h2>Usuário: ${user.name}</h2>`,
      '<table>',
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>',
    ];

    for (const item of items) {
      reportLines.push(this.buildHtmlRow(item));
    }

    reportLines.push('</table>', `<h3>Total: ${total}</h3>`, '</body></html>');

    return reportLines.join('\n');
  }

  buildHtmlRow(item) {
    return item.priority
      ? `<tr style="font-weight:bold;"><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>`
      : `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>`;
  }

  isAdmin(user) {
    return user?.role === 'ADMIN';
  }

  isStandardUser(user) {
    return user?.role === 'USER';
  }
}

