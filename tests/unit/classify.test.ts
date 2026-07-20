import { describe, expect, it } from 'vitest';
import { classify, isHiddenWhenIdenticalOff } from '../../src/diff/classify';

describe('classify', () => {
  it('marks a file present only on the right as added', () => {
    expect(classify(null, 'file', 'unknown')).toBe('added');
  });

  it('marks a file present only on the left as removed', () => {
    expect(classify('file', null, 'unknown')).toBe('removed');
  });

  it('marks a dir vs file as type-changed', () => {
    expect(classify('dir', 'file', 'unknown')).toBe('type-changed');
    expect(classify('file', 'dir', 'unknown')).toBe('type-changed');
  });

  it('marks two files with equal content as identical', () => {
    expect(classify('file', 'file', 'equal')).toBe('identical');
  });

  it('marks two files with different content as modified', () => {
    expect(classify('file', 'file', 'different')).toBe('modified');
  });

  it('leaves two files pending when content equality is unknown', () => {
    expect(classify('file', 'file', 'unknown')).toBe('pending');
  });

  it('treats two dirs as an identical container regardless of descendants', () => {
    expect(classify('dir', 'dir', 'unknown')).toBe('identical');
  });

  it('treats absence on both sides as identical', () => {
    expect(classify(null, null, 'unknown')).toBe('identical');
  });
});

describe('isHiddenWhenIdenticalOff', () => {
  it('hides identical files', () => {
    expect(isHiddenWhenIdenticalOff('file', 'identical')).toBe(true);
  });

  it('keeps identical directories', () => {
    expect(isHiddenWhenIdenticalOff('dir', 'identical')).toBe(false);
  });

  it('keeps modified files', () => {
    expect(isHiddenWhenIdenticalOff('file', 'modified')).toBe(false);
  });
});
