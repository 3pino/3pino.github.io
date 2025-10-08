import { describe, it, expect, beforeEach } from 'vitest';
import { TableState } from '../../../src/state/TableState';

describe('TableState', () => {
  let tableState: TableState;

  beforeEach(() => {
    tableState = new TableState();
  });

  describe('sortAllJValues()', () => {
    it('should sort J-values in descending order for a single row', () => {
      const rowId = tableState.addRow({
        shift: '7.25',
        multiplicity: 'd',
        jValues: [5.2, 10.8, 7.3],
        integration: 1,
        assignment: 'CH'
      });

      tableState.sortAllJValues();

      const row = tableState.getRow(rowId);
      expect(row?.jValues).toEqual([10.8, 7.3, 5.2]);
    });

    it('should sort J-values in descending order for multiple rows', () => {
      const rowId1 = tableState.addRow({
        shift: '7.25',
        multiplicity: 'dd',
        jValues: [3.5, 12.1, 7.0],
        integration: 1,
        assignment: 'CH'
      });

      const rowId2 = tableState.addRow({
        shift: '3.50',
        multiplicity: 't',
        jValues: [6.5, 6.4],
        integration: 2,
        assignment: 'CH2'
      });

      tableState.sortAllJValues();

      const row1 = tableState.getRow(rowId1);
      const row2 = tableState.getRow(rowId2);
      
      expect(row1?.jValues).toEqual([12.1, 7.0, 3.5]);
      expect(row2?.jValues).toEqual([6.5, 6.4]);
    });

    it('should handle rows with empty J-values', () => {
      const rowId = tableState.addRow({
        shift: '7.25',
        multiplicity: 's',
        jValues: [],
        integration: 3,
        assignment: 'CH3'
      });

      tableState.sortAllJValues();

      const row = tableState.getRow(rowId);
      expect(row?.jValues).toEqual([]);
    });

    it('should handle rows with single J-value', () => {
      const rowId = tableState.addRow({
        shift: '7.25',
        multiplicity: 'd',
        jValues: [7.5],
        integration: 1,
        assignment: 'CH'
      });

      tableState.sortAllJValues();

      const row = tableState.getRow(rowId);
      expect(row?.jValues).toEqual([7.5]);
    });

    it('should handle rows with already sorted J-values', () => {
      const rowId = tableState.addRow({
        shift: '7.25',
        multiplicity: 'dd',
        jValues: [15.2, 8.0, 3.1],
        integration: 1,
        assignment: 'CH'
      });

      tableState.sortAllJValues();

      const row = tableState.getRow(rowId);
      expect(row?.jValues).toEqual([15.2, 8.0, 3.1]);
    });

    it('should notify listeners when J-values are sorted', () => {
      let notificationCount = 0;
      tableState.onChange(() => {
        notificationCount++;
      });

      const rowId = tableState.addRow({
        shift: '7.25',
        multiplicity: 'd',
        jValues: [5.2, 10.8],
        integration: 1,
        assignment: 'CH'
      });

      // Reset count after initial addRow notification
      notificationCount = 0;

      tableState.sortAllJValues();

      expect(notificationCount).toBe(1);
    });

    it('should handle mixed rows with and without J-values', () => {
      const rowId1 = tableState.addRow({
        shift: '7.25',
        multiplicity: 's',
        jValues: [],
        integration: 3,
        assignment: 'CH3'
      });

      const rowId2 = tableState.addRow({
        shift: '3.50',
        multiplicity: 'dd',
        jValues: [4.2, 12.5, 8.1],
        integration: 1,
        assignment: 'CH'
      });

      const rowId3 = tableState.addRow({
        shift: '2.10',
        multiplicity: 't',
        jValues: [7.0, 6.8],
        integration: 2,
        assignment: 'CH2'
      });

      tableState.sortAllJValues();

      const row1 = tableState.getRow(rowId1);
      const row2 = tableState.getRow(rowId2);
      const row3 = tableState.getRow(rowId3);

      expect(row1?.jValues).toEqual([]);
      expect(row2?.jValues).toEqual([12.5, 8.1, 4.2]);
      expect(row3?.jValues).toEqual([7.0, 6.8]);
    });
  });
});
