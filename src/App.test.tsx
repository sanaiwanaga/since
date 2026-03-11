import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { STORAGE_KEY } from './utils/storage';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders empty state', () => {
    render(<App />);
    expect(screen.getByText('まだイベントがありません')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'イベントを追加' })).toBeInTheDocument();
  });

  it('creates, updates, triggers, and deletes an event', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<App />);

    await user.click(screen.getByRole('button', { name: 'イベントを追加' }));
    await user.type(screen.getByLabelText('イベント名'), 'うんち');
    await user.click(screen.getByRole('button', { name: '追加' }));

    expect(screen.getByRole('heading', { name: 'うんち' })).toBeInTheDocument();
    expect(screen.getByText('詳細')).toBeInTheDocument();
    expect(screen.getAllByText('未記録').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: '詳細' }));
    await user.click(screen.getByRole('button', { name: '編集' }));
    const input = await screen.findByLabelText('イベント名を編集');
    await user.clear(input);
    await user.type(input, '散歩');
    await user.click(screen.getAllByRole('button', { name: '保存' })[0]);

    expect(screen.getByRole('heading', { name: '散歩' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'GO' }));
    expect(screen.getByText('前回記録')).toBeInTheDocument();
    expect(screen.getByText('平均間隔')).toBeInTheDocument();
    expect(screen.getByText('1回')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '削除' }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(screen.getByText('まだイベントがありません')).toBeInTheDocument();
  });

  it('renders detail page with collapsible history timeline and calendar marks', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-10T12:30:00.000Z'));

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: '1',
          name: 'うんち',
          createdAt: '2026-03-03T12:30:00.000Z',
          updatedAt: '2026-03-09T12:30:00.000Z',
          color: '#f97316',
          targetInterval: { value: 3, unit: 'days' },
          history: [
            { ts: '2026-03-03T12:30:00.000Z' },
            { ts: '2026-03-04T12:30:00.000Z' },
            { ts: '2026-03-06T00:30:00.000Z' },
            { ts: '2026-03-09T12:30:00.000Z' },
          ],
        },
      ]),
    );

    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: '詳細' }));

    expect(screen.getByText('平均間隔')).toBeInTheDocument();
    expect(screen.getByText('2日 0時間 0分')).toBeInTheDocument();
    expect(screen.getByText('4回')).toBeInTheDocument();
    expect(screen.queryByText('3日')).not.toBeInTheDocument();
    expect(screen.getByRole('grid', { name: '2026年3月 のカレンダー' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: '2026-03-09 記録あり' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: '2026-03-06 記録あり' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '履歴を見る' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: '履歴' })).not.toBeInTheDocument();
    expect(screen.queryByText('前回から')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '履歴を見る' }));

    expect(screen.getByRole('button', { name: '履歴を閉じる' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: '履歴' })).toBeInTheDocument();
    expect(screen.getAllByText(/2026\/03\//).length).toBeGreaterThan(0);
    expect(screen.getAllByText('前回から').length).toBeGreaterThan(0);
    expect(screen.getByText('3日 12時間 0分')).toBeInTheDocument();
  });

  it('exports all event data as JSON and shows a success message', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:backup'),
        revokeObjectURL: vi.fn(),
      }),
    );
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: '1',
          name: 'うんち',
          createdAt: '2026-03-03T12:30:00.000Z',
          updatedAt: '2026-03-09T12:30:00.000Z',
          color: '#ea580c',
          targetInterval: null,
          history: [{ ts: '2026-03-09T12:30:00.000Z' }],
        },
      ]),
    );

    render(<App />);

    await user.click(screen.getByRole('button', { name: '設定' }));
    await user.click(screen.getByRole('button', { name: 'JSONを書き出す' }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(vi.mocked(URL.createObjectURL).mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:backup');
    expect(screen.getByText('JSONを書き出しました。')).toBeInTheDocument();
  });

  it('imports valid JSON and shows success and error messages', async () => {
    const user = userEvent.setup();
    class MockFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;
      onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => unknown) | null = null;

      readAsText(file: Blob) {
        const name = (file as File).name;
        if (name === 'backup.json') {
          this.result = JSON.stringify([
            {
              id: '1',
              name: 'うんち',
              createdAt: '2026-03-03T12:30:00.000Z',
              updatedAt: '2026-03-09T12:30:00.000Z',
              color: '#ea580c',
              targetInterval: null,
              history: [{ ts: '2026-03-09T12:30:00.000Z' }],
            },
          ]);
        } else {
          this.result = '{"bad":true}';
        }

        this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
      }
    }

    vi.stubGlobal('FileReader', MockFileReader);
    render(<App />);

    await user.click(screen.getByRole('button', { name: '設定' }));
    const input = screen.getByLabelText('バックアップJSONを選択');
    const validFile = new File(['ignored'], 'backup.json', { type: 'application/json' });

    await user.upload(input, validFile);

    expect(await screen.findByRole('heading', { name: 'うんち' })).toBeInTheDocument();
    expect(screen.getByText('バックアップを読み込みました。')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '設定' }));
    const invalidFile = new File(['{"bad":true}'], 'bad.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('バックアップJSONを選択'), invalidFile);

    expect(await screen.findByText('JSON形式が正しくありません。')).toBeInTheDocument();
  });

  it('creates an event with the selected color', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'イベントを追加' }));
    await user.type(screen.getByLabelText('イベント名'), 'うんち');
    await user.click(screen.getByRole('button', { name: '色を #3b82f6 に設定' }));
    await user.click(screen.getByRole('button', { name: '追加' }));

    expect(screen.getByRole('heading', { name: 'うんち' })).toBeInTheDocument();

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toContain('"color":"#3b82f6"');
  });

  it('creates an event with an optional target interval', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'イベントを追加' }));
    await user.type(screen.getByLabelText('イベント名'), '散歩');
    await user.type(screen.getByLabelText('目標値'), '2');
    await user.selectOptions(screen.getByLabelText('目標単位'), 'weeks');
    await user.click(screen.getByRole('button', { name: '追加' }));

    expect(screen.getByRole('heading', { name: '散歩' })).toBeInTheDocument();

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toContain('"targetInterval":{"value":2,"unit":"weeks"}');
  });

  it('updates target interval from detail page', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'イベントを追加' }));
    await user.type(screen.getByLabelText('イベント名'), 'うんち');
    await user.click(screen.getByRole('button', { name: '追加' }));
    await user.click(screen.getByRole('button', { name: '詳細' }));
    await user.click(screen.getByRole('button', { name: '編集' }));
    await user.type(screen.getByLabelText('目標値'), '3');
    await user.selectOptions(screen.getByLabelText('目標単位'), 'weeks');
    await user.click(screen.getAllByRole('button', { name: '保存' })[1]);

    expect(screen.getByText('3週')).toBeInTheDocument();
    expect(screen.getByText('目標 3週')).toBeInTheDocument();

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toContain('"targetInterval":{"value":3,"unit":"weeks"}');
  });

  it('shows global history entries in the history tab', async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: '1',
          name: 'うんち',
          createdAt: '2026-03-03T12:30:00.000Z',
          updatedAt: '2026-03-09T12:30:00.000Z',
          color: '#ea580c',
          targetInterval: null,
          history: [{ ts: '2026-03-09T12:30:00.000Z' }],
        },
        {
          id: '2',
          name: '掃除',
          createdAt: '2026-03-02T12:30:00.000Z',
          updatedAt: '2026-03-08T12:30:00.000Z',
          color: '#3b82f6',
          targetInterval: null,
          history: [{ ts: '2026-03-08T12:30:00.000Z' }],
        },
      ]),
    );

    render(<App />);

    await user.click(screen.getByRole('button', { name: '履歴' }));

    expect(screen.getByRole('heading', { name: '全体の履歴' })).toBeInTheDocument();
    expect(screen.getByText('直近14日の日別記録数')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '直近14日の日別記録数グラフ' })).toBeInTheDocument();
    expect(screen.getByLabelText('対象イベント')).toHaveValue('1');
    expect(screen.getAllByText('うんち').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: '詳細' }).length).toBeGreaterThan(0);
  });

  it('shows about information in settings', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '設定' }));

    expect(screen.getByText('表示')).toBeInTheDocument();
    expect(screen.getByText('アプリの表示方法を変更できます。')).toBeInTheDocument();
    expect(screen.getByLabelText('テーマ')).toHaveValue('まもなく対応');
    expect(screen.getByText('データ管理')).toBeInTheDocument();
    expect(screen.getByText('イベントデータのバックアップや復元ができます。')).toBeInTheDocument();
    expect(screen.getByText('Since')).toBeInTheDocument();
    expect(screen.getByText('周期ログアプリ')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    expect(screen.getByText('© Sana Iwanaga')).toBeInTheDocument();
  });

  it('persists selected event sort order and applies it on home', async () => {
    const user = userEvent.setup();

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        {
          id: '1',
          name: 'ねいる',
          createdAt: '2026-03-01T00:00:00.000Z',
          updatedAt: '2026-03-10T00:00:00.000Z',
          color: '#ea580c',
          targetInterval: null,
          history: [{ ts: '2026-03-10T00:00:00.000Z' }],
        },
        {
          id: '2',
          name: 'うんち',
          createdAt: '2026-03-05T00:00:00.000Z',
          updatedAt: '2026-03-05T00:00:00.000Z',
          color: '#3b82f6',
          targetInterval: null,
          history: [],
        },
      ]),
    );

    render(<App />);

    await user.click(screen.getByRole('button', { name: '設定' }));
    await user.selectOptions(screen.getByLabelText('並び順'), 'nameAsc');

    expect(window.localStorage.getItem('since.app-settings')).toContain('"eventSortOrder":"nameAsc"');

    await user.click(screen.getByRole('button', { name: 'ホーム' }));

    const eventHeadings = screen
      .getAllByRole('heading', { level: 2 })
      .filter((heading) => heading.textContent !== '記録中のイベント');
    expect(eventHeadings[0]).toHaveTextContent('うんち');
    expect(eventHeadings[1]).toHaveTextContent('ねいる');
  });

  it('switches language to English and saves the selection', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '設定' }));
    await user.selectOptions(screen.getByLabelText('言語'), 'en');

    expect(window.localStorage.getItem('since.app-settings')).toContain('"language":"en"');
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByLabelText('Language')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });
});
