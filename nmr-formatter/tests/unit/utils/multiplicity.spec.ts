import { describe, it, expect } from 'vitest';
import { NMRPeak } from '../../../src/models/NMRPeak';

const multipletnumbers = NMRPeak.multipletnumbers;
const isJValuesOptional = NMRPeak.isJValuesOptional;

describe('NMRPeak.multipletnumbers()', () => {
  describe('Basic single multiplicities', () => {
    it('should return null for singlet (abbreviation)', () => {
      expect(multipletnumbers('s')).toBeNull();
    });

    it('should return null for singlet (full word)', () => {
      expect(multipletnumbers('singlet')).toBeNull();
    });

    it('should return [2] for doublet (abbreviation)', () => {
      expect(multipletnumbers('d')).toEqual([2]);
    });

    it('should return [2] for doublet (full word)', () => {
      expect(multipletnumbers('doublet')).toEqual([2]);
    });

    it('should return [3] for triplet (abbreviation)', () => {
      expect(multipletnumbers('t')).toEqual([3]);
    });

    it('should return [3] for triplet (full word)', () => {
      expect(multipletnumbers('triplet')).toEqual([3]);
    });

    it('should return [4] for quartet (abbreviation)', () => {
      expect(multipletnumbers('q')).toEqual([4]);
    });

    it('should return [4] for quartet (full word)', () => {
      expect(multipletnumbers('quartet')).toEqual([4]);
    });

    it('should return [5] for quintet (abbreviation)', () => {
      expect(multipletnumbers('quint')).toEqual([5]);
    });

    it('should return [5] for quintet (full word)', () => {
      expect(multipletnumbers('quintet')).toEqual([5]);
    });

    it('should return [6] for sextet (abbreviation)', () => {
      expect(multipletnumbers('sext')).toEqual([6]);
    });

    it('should return [6] for sextet (full word)', () => {
      expect(multipletnumbers('sextet')).toEqual([6]);
    });

    it('should return [7] for septet (abbreviation)', () => {
      expect(multipletnumbers('sept')).toEqual([7]);
    });

    it('should return [7] for septet (full word)', () => {
      expect(multipletnumbers('septet')).toEqual([7]);
    });

    it('should return [8] for octet (abbreviation)', () => {
      expect(multipletnumbers('oct')).toEqual([8]);
    });

    it('should return [8] for octet (full word)', () => {
      expect(multipletnumbers('octet')).toEqual([8]);
    });

    it('should return [9] for nonet (abbreviation)', () => {
      expect(multipletnumbers('non')).toEqual([9]);
    });

    it('should return [9] for nonet (full word)', () => {
      expect(multipletnumbers('nonet')).toEqual([9]);
    });
  });

  describe('Multiplet and broad', () => {
    it('should return null for multiplet (abbreviation)', () => {
      expect(multipletnumbers('m')).toBeNull();
    });

    it('should return null for multiplet (full word)', () => {
      expect(multipletnumbers('multiplet')).toBeNull();
    });

    it('should return null for broad (abbreviation)', () => {
      expect(multipletnumbers('br')).toBeNull();
    });

    it('should return null for broad (full word)', () => {
      expect(multipletnumbers('broad')).toBeNull();
    });
  });

  describe('Broad combinations', () => {
    it('should return null for broad singlet', () => {
      expect(multipletnumbers('br s')).toBeNull();
    });

    it('should return null for broad singlet (compact)', () => {
      expect(multipletnumbers('bs')).toBeNull();
    });

    it('should return [2] for broad doublet', () => {
      expect(multipletnumbers('br d')).toEqual([2]);
    });

    it('should return [2] for broad doublet (compact)', () => {
      expect(multipletnumbers('bd')).toEqual([2]);
    });

    it('should return [3] for broad triplet (full words)', () => {
      expect(multipletnumbers('broad triplet')).toEqual([3]);
    });
  });

  describe('Compound multiplicities (abbreviations)', () => {
    it('should return [2, 2] for doublet of doublets', () => {
      expect(multipletnumbers('dd')).toEqual([2, 2]);
    });

    it('should return [2, 3] for doublet of triplets', () => {
      expect(multipletnumbers('dt')).toEqual([2, 3]);
    });

    it('should return [3, 2] for triplet of doublets', () => {
      expect(multipletnumbers('td')).toEqual([3, 2]);
    });

    it('should return [3, 3] for triplet of triplets', () => {
      expect(multipletnumbers('tt')).toEqual([3, 3]);
    });

    it('should return [2, 2, 2] for doublet of doublet of doublets', () => {
      expect(multipletnumbers('ddd')).toEqual([2, 2, 2]);
    });

    it('should return [2, 2, 3] for doublet of doublet of triplets', () => {
      expect(multipletnumbers('ddt')).toEqual([2, 2, 3]);
    });

    it('should return [2, 3, 2] for doublet of triplet of doublets', () => {
      expect(multipletnumbers('dtd')).toEqual([2, 3, 2]);
    });
  });

  describe('Compound multiplicities (full words with "of")', () => {
    it('should return [2, 2] for doublet of doublets (full words)', () => {
      expect(multipletnumbers('doublet of doublets')).toEqual([2, 2]);
    });

    it('should return [2, 3] for doublet of triplets (full words)', () => {
      expect(multipletnumbers('doublet of triplets')).toEqual([2, 3]);
    });

    it('should return [3, 2] for triplet of doublets (full words)', () => {
      expect(multipletnumbers('triplet of doublets')).toEqual([3, 2]);
    });
  });

  describe('Parentheses cases', () => {
    it('should return [3, 3] for multiplet with triplet of triplets in parentheses', () => {
      expect(multipletnumbers('m (tt)')).toEqual([3, 3]);
    });

    it('should return [2, 3] for multiplet with doublet of triplets in parentheses', () => {
      expect(multipletnumbers('m (dt)')).toEqual([2, 3]);
    });
  });

  describe('Hyphen/dash variations', () => {
    it('should return [2, 3] for doublet of triplets (hyphens)', () => {
      expect(multipletnumbers('doublet-of-triplets')).toEqual([2, 3]);
    });

    it('should return [2, 3] for doublet of triplets (hyphen abbreviation)', () => {
      expect(multipletnumbers('d-t')).toEqual([2, 3]);
    });

    it('should return [2, 3] for doublet of triplets (en dash)', () => {
      expect(multipletnumbers('d–t')).toEqual([2, 3]);
    });
  });

  describe('Multiplet + other multiplicity (allowed)', () => {
    it('should return [2] for multiplet + doublet (allowed)', () => {
      expect(multipletnumbers('md')).toEqual([2]);
    });

    it('should return [3] for multiplet + triplet (allowed)', () => {
      expect(multipletnumbers('mt')).toEqual([3]);
    });

    it('should return [2] for multiplet doublet with space (allowed)', () => {
      expect(multipletnumbers('m d')).toEqual([2]);
    });
  });

  describe('Plural variations', () => {
    it('should return [2] for doublets (plural)', () => {
      expect(multipletnumbers('doublets')).toEqual([2]);
    });

    it('should return [3] for triplets (plural)', () => {
      expect(multipletnumbers('triplets')).toEqual([3]);
    });

    it('should return null for singlets (plural)', () => {
      expect(multipletnumbers('singlets')).toBeNull();
    });

    it('should return null for multiplets (plural)', () => {
      expect(multipletnumbers('multiplets')).toBeNull();
    });
  });

  describe('Error cases - invalid combinations', () => {
    it('should throw error for double singlet (ss)', () => {
      expect(() => multipletnumbers('ss')).toThrow();
    });

    it('should throw error for double multiplet (mm)', () => {
      expect(() => multipletnumbers('mm')).toThrow();
    });

    it('should throw error for singlet singlet (full words)', () => {
      expect(() => multipletnumbers('singlet singlet')).toThrow();
    });

    it('should throw error for multiplet multiplet (full words)', () => {
      expect(() => multipletnumbers('multiplet multiplet')).toThrow();
    });

    it('should throw error for singlet + doublet (sd)', () => {
      expect(() => multipletnumbers('sd')).toThrow();
    });

    it('should throw error for multiplet + singlet (ms)', () => {
      expect(() => multipletnumbers('ms')).toThrow();
    });

    it('should throw error for singlet + multiplet (sm)', () => {
      expect(() => multipletnumbers('sm')).toThrow();
    });

    it('should throw error for doublet + singlet (ds)', () => {
      expect(() => multipletnumbers('ds')).toThrow();
    });

    it('should throw error for triplet + multiplet (tm)', () => {
      expect(() => multipletnumbers('tm')).toThrow();
    });

    it('should throw error for doublet singlet (full words)', () => {
      expect(() => multipletnumbers('doublet singlet')).toThrow();
    });

    it('should throw error for singlet of doublet (full words)', () => {
      expect(() => multipletnumbers('singlet of doublet')).toThrow();
    });
  });
});

describe('NMRPeak.isJValuesOptional()', () => {
  describe('Regular multiplicities - J-values not optional', () => {
    it('should return false for singlet', () => {
      expect(isJValuesOptional('s')).toBe(false);
    });

    it('should return false for doublet', () => {
      expect(isJValuesOptional('d')).toBe(false);
    });

    it('should return false for doublet of triplets', () => {
      expect(isJValuesOptional('dt')).toBe(false);
    });

    it('should return false for doublet of doublet of doublets', () => {
      expect(isJValuesOptional('ddd')).toBe(false);
    });
  });

  describe('Multiplet/broad alone - J-values must be 0', () => {
    it('should return false for multiplet alone (J must be 0)', () => {
      expect(isJValuesOptional('m')).toBe(false);
    });

    it('should return false for multiplet (full) alone (J must be 0)', () => {
      expect(isJValuesOptional('multiplet')).toBe(false);
    });

    it('should return false for broad alone (J must be 0)', () => {
      expect(isJValuesOptional('br')).toBe(false);
    });

    it('should return false for broad (full) alone (J must be 0)', () => {
      expect(isJValuesOptional('broad')).toBe(false);
    });

    it('should return false for broad singlet (J must be 0)', () => {
      expect(isJValuesOptional('br s')).toBe(false);
    });

    it('should return false for broad singlet compact (J must be 0)', () => {
      expect(isJValuesOptional('bs')).toBe(false);
    });
  });

  describe('Broad + multiplicity - J-values optional', () => {
    it('should return true for broad doublet', () => {
      expect(isJValuesOptional('br d')).toBe(true);
    });

    it('should return true for broad doublet (compact)', () => {
      expect(isJValuesOptional('bd')).toBe(true);
    });

    it('should return true for broad triplet', () => {
      expect(isJValuesOptional('broad triplet')).toBe(true);
    });
  });

  describe('Multiplet with parentheses - J-values optional', () => {
    it('should return true for multiplet with tt', () => {
      expect(isJValuesOptional('m (tt)')).toBe(true);
    });

    it('should return true for multiplet with dt', () => {
      expect(isJValuesOptional('m (dt)')).toBe(true);
    });

    it('should return true for multiplet with dd (no space)', () => {
      expect(isJValuesOptional('m(dd)')).toBe(true);
    });
  });
});
