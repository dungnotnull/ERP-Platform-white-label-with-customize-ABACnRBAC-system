import { detectCsvDelimiter, getCsvValue, parseCsvBuffer } from './csv.util';

describe('csv.util', () => {
  describe('detectCsvDelimiter', () => {
    it('detects semicolon delimiter', () => {
      const content = 'name;email;employeeCode\nJohn;john@example.com;EMP-001';
      expect(detectCsvDelimiter(content)).toBe(';');
    });

    it('detects comma delimiter', () => {
      const content = 'name,email,employeeCode\nJohn,john@example.com,EMP-001';
      expect(detectCsvDelimiter(content)).toBe(',');
    });

    it('defaults to comma for empty content', () => {
      expect(detectCsvDelimiter('')).toBe(',');
    });
  });

  describe('parseCsvBuffer', () => {
    it('parses semicolon-separated employee rows', async () => {
      const content = [
        'name;email;employeeCode;department;position;isActive',
        'ĐỖ THỊ CẨM TÚ;do-t@example.com;BPO-0001;HR-GA;2;TRUE',
        'LÊ QUANG VINH;le-v@example.com;BPO-0002;;2;TRUE',
      ].join('\n');

      const rows = await parseCsvBuffer(Buffer.from(content, 'utf8'));

      expect(rows).toHaveLength(2);
      expect(rows[0]).toMatchObject({
        name: 'ĐỖ THỊ CẨM TÚ',
        email: 'do-t@example.com',
        employeeCode: 'BPO-0001',
        department: 'HR-GA',
        position: '2',
        isActive: 'TRUE',
      });
      expect(rows[1].department).toBe('');
      expect(getCsvValue(rows[1], ['email'])).toBe('le-v@example.com');
    });

    it('still parses comma-separated rows', async () => {
      const content = 'name,email,employeeCode\nJane,jane@example.com,EMP-002';
      const rows = await parseCsvBuffer(Buffer.from(content, 'utf8'));

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        name: 'Jane',
        email: 'jane@example.com',
        employeeCode: 'EMP-002',
      });
    });

    it('parses semicolon-separated device rows', async () => {
      const content = [
        'deviceType;serialNumber;name;model;purchaseDate;warrantyExpiryDate;manufacturer;purchasePrice;notes;deviceStatus',
        'Laptop;SN-001;MacBook Pro;M3;2024-01-01;2027-01-01;Apple;2500;New device;available',
      ].join('\n');

      const rows = await parseCsvBuffer(Buffer.from(content, 'utf8'));

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        deviceType: 'Laptop',
        serialNumber: 'SN-001',
        name: 'MacBook Pro',
        model: 'M3',
        purchaseDate: '2024-01-01',
        warrantyExpiryDate: '2027-01-01',
        manufacturer: 'Apple',
        purchasePrice: '2500',
        notes: 'New device',
        deviceStatus: 'available',
      });
    });
  });
});
