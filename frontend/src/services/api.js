import { supabase, checkConnection } from './supabase';

// 檢查雲端是否在線
export async function checkBackendHealth() {
  return await checkConnection();
}

// ==================== 日記 API ====================

export async function fetchDiaries() {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function fetchDiary(date) {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('date', date)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data || null;
}

export async function saveDiary(diary) {
  const { date, content, mood, tags, createdAt, updatedAt } = diary;
  
  const { data, error } = await supabase
    .from('diaries')
    .upsert({
      date,
      content,
      mood,
      tags: tags || [],
      created_at: createdAt,
      updated_at: updatedAt
    }, { onConflict: 'date' });
  
  if (error) throw error;
  return { success: true };
}

export async function syncDiaries(diaries) {
  const formatted = diaries.map(d => ({
    date: d.date,
    content: d.content,
    mood: d.mood,
    tags: d.tags || [],
    created_at: d.createdAt,
    updated_at: d.updatedAt
  }));

  const { error } = await supabase
    .from('diaries')
    .upsert(formatted, { onConflict: 'date' });
  
  if (error) throw error;
  return { success: true, count: diaries.length };
}

// ==================== 照片 API ====================

export async function fetchPhotos() {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function fetchPhotosByDate(date) {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('diary_date', date);
  
  if (error) throw error;
  return data || [];
}

export async function savePhoto(photo) {
  const { diaryDate, filename, data, caption, createdAt } = photo;
  
  const { data: result, error } = await supabase
    .from('photos')
    .insert({
      diary_date: diaryDate,
      filename,
      data, // Base64 圖片資料
      caption,
      created_at: createdAt
    })
    .select()
    .single();
  
  if (error) throw error;
  return { success: true, id: result.id };
}

export async function syncPhotos(photos) {
  const formatted = photos.map(p => ({
    diary_date: p.diaryDate,
    filename: p.filename,
    data: p.data,
    caption: p.caption,
    created_at: p.createdAt
  }));

  const { error } = await supabase
    .from('photos')
    .insert(formatted);
  
  if (error) throw error;
  return { success: true };
}

export async function deletePhotoFromServer(id) {
  const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { success: true };
}

// ==================== 紀念日 API ====================

export async function fetchAnniversaries() {
  const { data, error } = await supabase
    .from('anniversaries')
    .select('*')
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function saveAnniversary(anniversary) {
  const { title, date, type, remind, createdAt } = anniversary;
  
  const { data, error } = await supabase
    .from('anniversaries')
    .insert({
      title,
      date,
      type,
      remind,
      created_at: createdAt
    })
    .select()
    .single();
  
  if (error) throw error;
  return { success: true, id: data.id };
}

export async function syncAnniversaries(anniversaries) {
  // 先刪除所有，再重新插入（簡單的同步策略）
  await supabase.from('anniversaries').delete().neq('id', 0);
  
  const formatted = anniversaries.map(a => ({
    title: a.title,
    date: a.date,
    type: a.type,
    remind: a.remind,
    created_at: a.createdAt
  }));

  const { error } = await supabase
    .from('anniversaries')
    .insert(formatted);
  
  if (error) throw error;
  return { success: true, count: anniversaries.length };
}

export async function deleteAnniversaryFromServer(id) {
  const { error } = await supabase
    .from('anniversaries')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return { success: true };
}

// ==================== 設定 API ====================

export async function fetchSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*');
  
  if (error) throw error;
  
  const settings = {};
  data?.forEach(row => {
    settings[row.key] = row.value;
  });
  return settings;
}

export async function saveSettings(settings) {
  for (const [key, value] of Object.entries(settings)) {
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });
    
    if (error) throw error;
  }
  return { success: true };
}