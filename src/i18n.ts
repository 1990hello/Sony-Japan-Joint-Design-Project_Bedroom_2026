export type AppLanguage = 'en' | 'ja';

const ja: Record<string, string> = {
  'Bedroom': 'ベッドルーム', 'Aquarium': 'アクアリウム', 'SCENE': 'シーン',
  'Work-to-Life Emotional Transition': '仕事から自分の時間へ',
  '1. Acknowledgement': '1. 今日を振り返る', '2. Encouragement': '2. 自分をねぎらう', '3. Closure': '3. 仕事を手放す',
  'Stage 1 — Acknowledgement': 'ステージ1 — 今日を振り返る', 'Stage 2 — Encouragement': 'ステージ2 — 自分をねぎらう', 'Stage 3 — Closure': 'ステージ3 — 仕事を手放す', 'Ritual Complete': 'ひと区切り',
  'Your Turn': 'やってみよう', 'Observe': '見てみよう', 'Wave Hand to Begin': '手を振ってスタート', 'Return Orb to Dock': 'オーブを戻す',
  'Eat Film': 'フィルムを食べる', 'Dissolve in Water': '水に溶かす', 'Show Interface': '操作パネルを表示', 'Minimize Interface': '操作パネルを閉じる',
  'Hand Track On': '手の認識 ON', 'Hand Track Off': '手の認識 OFF', 'Hand Detected': '手を認識中', 'Show hand in front of camera': 'カメラに手を見せてね',
  'You can interact with webcam gestures or mouse click & drag': '手のジェスチャー、またはマウスのクリック＆ドラッグで操作できるよ',
  'Orb controls': 'オーブの操作', 'Two simple gestures': 'かんたんな2つの動き', 'Pinch to move orb': 'つまんでオーブを動かす', 'Wave to send orb back to docking station': '手を振ってオーブを戻す',
  'EXORA · INTERACTION GUIDE': 'EXORA · 操作ガイド', 'Observe & explore': '眺めて、探検しよう', 'Interact with the soundscape': '音の世界と遊ぼう', 'Daydream at your own pace': '自分のペースでぼんやりしよう',
  'To return to the orb:': 'オーブに戻るには：', 'bring both palms together and hold. The ring between your hands shows your progress.': '両手のひらを合わせて、そのままキープ。手の間のリングで進み具合がわかるよ。',
  '? INTERACTION GUIDE': '? 操作ガイド',
  'You don\'t have to do anything. Just be here.': '何もしなくていいよ。ここにいるだけでいい。',
  'STRESS:': 'ストレス：', 'HR:': '心拍：',
  'Action: Wave hand or click "Wave to Begin"': 'アクション：手を振るか「スタート」を押してね',
  'Action: Pinch to move orb. Wave to send orb back to docking station.': 'アクション：つまんでオーブを動かして、手を振ってドックに戻そう。',
  'Action: Choose your ritual — eat the film or dissolve it in water': 'アクション：フィルムを食べるか、水に溶かしてみよう',
  'When you are ready, pinch the doorway to enter the Aquarium.': '準備ができたら、ドアをつまんでアクアリウムへ。',
  'A calmer mind creates a brighter tomorrow.': '心が落ち着くと、明日が少し明るくなる。',
  "You've done enough. Now it's your time.": 'もう十分がんばったよ。ここからは、自分の時間。',
  "You've put in so much effort, and it really shows. Take a moment to be proud — you've done more than you think.": 'たくさんがんばってきたね。その努力はちゃんと伝わってるよ。少し誇りに思っていいんだよ。思っている以上に、たくさんのことをやり遂げてきたから。',
  'Observe: The central orb awakens...': '見てみよう：真ん中のオーブが目を覚ます…',
  'Observe: Work screens returning to the orb': '見てみよう：仕事の画面がオーブに戻っていく',
  'Observe: Daily achievements captured within the orb': '見てみよう：今日できたことがオーブの中に映し出される',
  'Observe: Lingering thoughts and work weight acknowledged': '見てみよう：まだ残っている思いや仕事の重みを受け止める',
  'Observe: Golden threads dissolving lingering worries': '見てみよう：金色の糸が心配ごとをほどいていく',
  'Observe: Words of encouragement taking form': '見てみよう：励ましの言葉が形になっていく',
  'Observe: The orb is freed and clear': '見てみよう：オーブがすっきりと解き放たれる',
  'Observe: The orb rests in the firewood dock': '見てみよう：オーブがドックに戻ってひと休み',
  'Observe: A glowing path forms toward the doorway': '見てみよう：ドアへ続く光の道が現れる',
  'Observe: Your edible film is being printed': '見てみよう：食べられるフィルムを印刷中',
  'Observe: Words of wisdom unfolding inside the orb': '見てみよう：オーブの中に心に残る言葉が浮かぶ',
  'Action: Drag over water glass to dissolve, or release to place down': 'アクション：コップの上に運んで溶かすか、手を離して置いてね',
};

export function translate(text: string, language: AppLanguage): string {
  if (language === 'en') return text;
  if (ja[text]) return ja[text];
  if (text.startsWith('Action: ')) return `アクション：${text.slice(8)}`;
  if (text.startsWith('Observe: ')) return `見てみよう：${text.slice(9)}`;
  return text;
}
