const db = require('../config/db');

const cleanDuplicateTeamsAndMatches = async () => {
  try {
    console.log('[DB CLEANUP] Bắt đầu tự sửa đổi dữ liệu và đồng bộ hóa đội bóng/trận đấu...');

    // Các cặp đội bóng bị trùng lắp: Tên cũ (tiếng Anh hoặc chưa chuẩn hóa) -> Tên chuẩn trong DB
    const teamRenameMap = {
      'Cape Verde Islands': 'Cabo Verde',
      'Cape Verde': 'Cabo Verde',
      'South Africa': 'Nam Phi',
      'Korea Republic': 'Hàn Quốc',
      'South Korea': 'Hàn Quốc',
      'Czech Republic': 'CH Séc',
      'Bosnia and Herzegovina': 'Bosnia',
      'Bosnia-Herzegovina': 'Bosnia',
    };

    for (const [oldName, newName] of Object.entries(teamRenameMap)) {
      // 1. Kiểm tra xem cả hai đội cũ và mới có tồn tại trong bảng teams không
      const oldTeamRes = await db.query('SELECT id FROM teams WHERE name = $1', [oldName]);
      const newTeamRes = await db.query('SELECT id FROM teams WHERE name = $1', [newName]);

      if (oldTeamRes.rows.length > 0) {
        if (newTeamRes.rows.length > 0) {
          console.log(`[DB CLEANUP] Gộp đội bóng "${oldName}" vào "${newName}"...`);
          
          // Cập nhật tất cả trận đấu đang tham chiếu tên đội cũ sang tên đội mới
          await db.query('UPDATE matches SET team1_name = $1 WHERE team1_name = $2', [newName, oldName]);
          await db.query('UPDATE matches SET team2_name = $1 WHERE team2_name = $2', [newName, oldName]);
          await db.query('UPDATE matches SET handicap_favorite = $1 WHERE handicap_favorite = $2', [newName, oldName]);
          
          // Xóa đội bóng cũ
          await db.query('DELETE FROM teams WHERE name = $1', [oldName]);
        } else {
          console.log(`[DB CLEANUP] Đổi tên đội bóng "${oldName}" thành "${newName}"...`);
          // Nếu đội mới chưa tồn tại, chỉ cần đổi tên đội cũ thành tên mới
          await db.query('UPDATE teams SET name = $1 WHERE name = $2', [newName, oldName]);
          
          // Cập nhật tên trong bảng trận đấu tương ứng
          await db.query('UPDATE matches SET team1_name = $1 WHERE team1_name = $2', [newName, oldName]);
          await db.query('UPDATE matches SET team2_name = $1 WHERE team2_name = $2', [newName, oldName]);
          await db.query('UPDATE matches SET handicap_favorite = $1 WHERE handicap_favorite = $2', [newName, oldName]);
        }
      }
    }

    // Xóa những đội bóng rác có tên trống
    await db.query("DELETE FROM teams WHERE name = '' OR name IS NULL");

    // 2. Tìm và gộp các trận đấu bị trùng lặp
    const matchesRes = await db.query('SELECT id, team1_name, team2_name, status, handicap_favorite, handicap_text, ou_text FROM matches');
    const matches = matchesRes.rows;

    const groups = {};
    for (const m of matches) {
      // Chuẩn hóa thứ tự tên đội để tìm trận trùng (ví dụ A vs B và B vs A là cùng 1 cặp)
      const key = [m.team1_name, m.team2_name].sort().join(' vs ');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(m);
    }

    for (const [key, group] of Object.entries(groups)) {
      if (group.length > 1) {
        console.log(`[DB CLEANUP] Phát hiện trùng lặp trận đấu cho "${key}":`, group.map(m => m.id));

        // Xác định "trận đấu chính" (Master)
        // Ưu tiên:
        // 1. Trận có thông tin kèo chấp (handicap_favorite và handicap_text)
        // 2. Trận có số lượt bình chọn (predictions) nhiều hơn
        // 3. Trận có số bình luận (comments) nhiều hơn
        // 4. Mặc định chọn trận có ID lớn hơn hoặc nhỏ hơn
        
        let master = group[0];
        let maxScore = -1;

        for (const m of group) {
          let score = 0;
          if (m.handicap_favorite && m.handicap_text) score += 100;
          if (m.status !== 'UPCOMING') score += 50;
          
          // Đếm số lượt dự đoán
          const predCountRes = await db.query('SELECT COUNT(*)::int as count FROM predictions WHERE match_id = $1', [m.id]);
          const predCount = predCountRes.rows[0].count;
          score += predCount * 10;

          // Đếm số bình luận
          const commCountRes = await db.query('SELECT COUNT(*)::int as count FROM comments WHERE match_id = $1', [m.id]);
          const commCount = commCountRes.rows[0].count;
          score += commCount;

          if (score > maxScore) {
            maxScore = score;
            master = m;
          }
        }

        console.log(`[DB CLEANUP] Chọn trận ID ${master.id} làm TRẬN CHÍNH cho "${key}".`);

        // Gộp dữ liệu của các trận trùng khác vào trận chính và xóa trận trùng đi
        for (const duplicate of group) {
          if (duplicate.id === master.id) continue;

          console.log(`[DB CLEANUP] Đang gộp dữ liệu từ trận trùng ID ${duplicate.id} vào trận chính ID ${master.id}...`);

          // Di chuyển dự đoán (xử lý trùng lặp dự đoán của cùng 1 user trên 2 trận trùng)
          const duplicatePredsRes = await db.query('SELECT * FROM predictions WHERE match_id = $1', [duplicate.id]);
          for (const pred of duplicatePredsRes.rows) {
            const existsRes = await db.query(
              'SELECT id FROM predictions WHERE user_id = $1 AND match_id = $2',
              [pred.user_id, master.id]
            );
            if (existsRes.rows.length === 0) {
              await db.query(
                'UPDATE predictions SET match_id = $1 WHERE id = $2',
                [master.id, pred.id]
              );
            } else {
              // Xóa dự đoán trùng nếu user đã dự đoán trên cả 2 trận
              await db.query('DELETE FROM predictions WHERE id = $1', [pred.id]);
            }
          }

          // Di chuyển bình luận (comments)
          await db.query('UPDATE comments SET match_id = $1 WHERE match_id = $2', [master.id, duplicate.id]);

          // Di chuyển thông báo (notifications)
          await db.query('UPDATE notifications SET match_id = $1 WHERE match_id = $2', [master.id, duplicate.id]);

          // Xóa trận trùng lặp
          await db.query('DELETE FROM matches WHERE id = $1', [duplicate.id]);
        }
      }
    }

    console.log('[DB CLEANUP] Hoàn tất quá trình dọn dẹp cơ sở dữ liệu.');
  } catch (error) {
    console.error('[DB CLEANUP] Lỗi khi dọn dẹp dữ liệu:', error);
  }
};

module.exports = { cleanDuplicateTeamsAndMatches };
