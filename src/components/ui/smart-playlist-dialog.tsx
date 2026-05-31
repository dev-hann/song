'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUpdatePlaylist } from '@/queries';
import { toast } from 'sonner';
import type { Playlist, SmartPlaylistRule, SmartPlaylistRules } from '@/types';

interface SmartPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist;
}

const FIELD_OPTIONS: { value: SmartPlaylistRule['field']; label: string }[] = [
  { value: 'channel', label: '아티스트' },
  { value: 'title', label: '제목' },
  { value: 'minDuration', label: '최소 재생시간(초)' },
  { value: 'maxDuration', label: '최대 재생시간(초)' },
  { value: 'addedAfter', label: '이후에 추가' },
  { value: 'addedBefore', label: '이전에 추가' },
];

const STRING_OPERATORS = [
  { value: 'contains' as const, label: '포함' },
  { value: 'equals' as const, label: '일치' },
  { value: 'startsWith' as const, label: '시작' },
];

const NUMBER_OPERATORS = [
  { value: 'gt' as const, label: '초과' },
  { value: 'lt' as const, label: '미만' },
  { value: 'gte' as const, label: '이상' },
  { value: 'lte' as const, label: '이하' },
];

const DATE_OPERATORS = [
  { value: 'gte' as const, label: '이후' },
  { value: 'lte' as const, label: '이전' },
];

function isTextField(field: SmartPlaylistRule['field']): boolean {
  return field === 'channel' || field === 'title';
}

function isDateField(field: SmartPlaylistRule['field']): boolean {
  return field === 'addedAfter' || field === 'addedBefore';
}

function SmartPlaylistForm({ playlist, onOpenChange }: { playlist: Playlist; onOpenChange: (open: boolean) => void }) {
  const initialRules: SmartPlaylistRules = playlist.rules ?? { match: 'all', conditions: [{ field: 'channel', operator: 'contains', value: '' }] };
  const [match, setMatch] = useState<'all' | 'any'>(initialRules.match);
  const [conditions, setConditions] = useState<SmartPlaylistRule[]>(initialRules.conditions);
  const updatePlaylist = useUpdatePlaylist();

  const addCondition = () => {
    setConditions([...conditions, { field: 'channel', operator: 'contains', value: '' }]);
  };

  const removeCondition = (index: number) => {
    if (conditions.length <= 1) {return;}
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, patch: Partial<SmartPlaylistRule>) => {
    setConditions(conditions.map((c, i) => {
      if (i !== index) {return c;}
      const updated = { ...c, ...patch };
      if (patch.field && patch.field !== c.field) {
        if (isTextField(patch.field)) {
          updated.operator = 'contains';
          updated.value = '';
        } else if (isDateField(patch.field)) {
          updated.operator = 'gte';
          updated.value = '';
        } else {
          updated.operator = 'gt';
          updated.value = 0;
        }
      }
      return updated;
    }));
  };

  const handleSubmit = async () => {
    const validConditions = conditions.filter((c) => {
      if (typeof c.value === 'string') {return c.value.trim().length > 0;}
      return true;
    });
    if (validConditions.length === 0) {
      toast.error('최소 1개의 조건이 필요합니다');
      return;
    }
    try {
      await updatePlaylist.mutateAsync({
        id: playlist.id,
        data: { rules: { match, conditions: validConditions } },
      });
      toast.success('스마트 재생목록 규칙이 저장되었습니다');
      onOpenChange(false);
    } catch {
      toast.error('저장에 실패했습니다');
    }
  };

  const handleRemoveRules = async () => {
    try {
      await updatePlaylist.mutateAsync({
        id: playlist.id,
        data: { rules: null },
      });
      toast.success('스마트 재생목록이 일반 재생목록으로 변경되었습니다');
      onOpenChange(false);
    } catch {
      toast.error('변경에 실패했습니다');
    }
  };

  return (
    <DialogContent showCloseButton={false} className="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>스마트 재생목록</DialogTitle>
        <DialogDescription>조건에 맞는 곡이 자동으로 추가됩니다</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => { setMatch('all'); }}
            className={`px-4 py-1.5 rounded-full text-sm ${match === 'all' ? 'bg-foreground text-background font-medium' : 'bg-white/5 text-muted'}`}
          >
            모두 만족
          </button>
          <button
            onClick={() => { setMatch('any'); }}
            className={`px-4 py-1.5 rounded-full text-sm ${match === 'any' ? 'bg-foreground text-background font-medium' : 'bg-white/5 text-muted'}`}
          >
            하나라도 만족
          </button>
        </div>

        <div className="space-y-3">
          {conditions.map((condition, i) => (
            <div key={i} className="space-y-2 p-3 bg-white/5 rounded-lg">
              <div className="flex gap-2">
                <select
                  value={condition.field}
                  onChange={(e) => { updateCondition(i, { field: e.target.value as SmartPlaylistRule['field'] }); }}
                  className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {FIELD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => { removeCondition(i); }}
                  disabled={conditions.length <= 1}
                  className="px-2 text-muted disabled:opacity-30"
                >
                  ✕
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={condition.operator}
                  onChange={(e) => { updateCondition(i, { operator: e.target.value as SmartPlaylistRule['operator'] }); }}
                  className="bg-surface rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {(isDateField(condition.field) ? DATE_OPERATORS : isTextField(condition.field) ? STRING_OPERATORS : NUMBER_OPERATORS).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {isDateField(condition.field) ? (
                  <input
                    type="date"
                    value={typeof condition.value === 'string' ? condition.value : ''}
                    onChange={(e) => { updateCondition(i, { value: e.target.value }); }}
                    className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                ) : (
                  <input
                    type={isTextField(condition.field) ? 'text' : 'number'}
                    value={condition.value}
                    onChange={(e) => {
                      const val = isTextField(condition.field) ? e.target.value : Number(e.target.value);
                      updateCondition(i, { value: val });
                    }}
                    placeholder={isTextField(condition.field) ? '값 입력' : '0'}
                    className="flex-1 bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addCondition}
          className="w-full py-2 rounded-lg bg-white/5 text-sm text-muted active:bg-white/10"
        >
          + 조건 추가
        </button>
      </div>

      <DialogFooter className="flex-col gap-2">
        {playlist.rules && (
          <Button
            variant="outline"
            onClick={() => { handleRemoveRules().catch(() => undefined); }}
            disabled={updatePlaylist.isPending}
            className="w-full"
          >
            일반 재생목록으로 변경
          </Button>
        )}
        <div className="flex gap-2 w-full">
          <DialogClose render={<Button variant="outline" className="flex-1" />}>
            취소
          </DialogClose>
          <Button
            onClick={() => { handleSubmit().catch(() => undefined); }}
            disabled={updatePlaylist.isPending}
            className="flex-1"
          >
            {updatePlaylist.isPending ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}

export function SmartPlaylistDialog({ open, onOpenChange, playlist }: SmartPlaylistDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SmartPlaylistForm playlist={playlist} onOpenChange={onOpenChange} />
    </Dialog>
  );
}
