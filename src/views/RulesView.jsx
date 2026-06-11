import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Coins, AlertTriangle, BookOpen, Compass, Award, ArrowRight, ShieldAlert } from 'lucide-react';

const RulesView = () => {
  return (
    <div className="rules-container animate-fade">
      <header className="rules-header">
        <div className="rules-header-icon">
          <BookOpen size={32} />
        </div>
        <h1 className="font-outfit">Luật Chơi & Thể Lệ</h1>
        <p>Hướng dẫn cách dự đoán, tính điểm phạt và quy đổi quỹ lương khô</p>
      </header>

      {/* Section 1: Core Penalties */}
      <section className="rules-section-card glass-card">
        <h2 className="section-title">
          <Coins size={22} color="#ffd200" /> 💰 Quy Tắc Đóng Góp Quỹ Lương Khô (10 / 30 bánh)
        </h2>
        <p className="section-intro">
          Để cuộc vui thêm phần kịch tính và gây quỹ cho các buổi liên hoan, mức đóng góp được tính dựa trên kết quả cược chấp của từng trận đấu:
        </p>

        <div className="penalty-grid">
          <div className="penalty-box correct">
            <div className="box-header">ĐOÁN ĐÚNG KÈO (Sau Chấp)</div>
            <div className="box-price">10 bánh</div>
            <div className="box-desc">Người chơi dự đoán chính xác kết quả sau kèo chấp (chọn đúng đội thắng kèo hoặc chọn cửa Hòa khi trận đấu hòa kèo) sẽ đóng góp <strong>10 bánh lương khô</strong> vào quỹ.</div>
          </div>

          <div className="penalty-box wrong">
            <div className="box-header">ĐOÁN SAI KÈO</div>
            <div className="box-price">30 bánh</div>
            <div className="box-desc">Người chơi dự đoán sai kết quả sau kèo chấp (chọn sai đội thắng kèo hoặc không chọn cửa Hòa khi trận đấu hòa kèo) sẽ đóng góp <strong>30 bánh lương khô</strong> vào quỹ.</div>
          </div>

          <div className="penalty-box missed">
            <div className="box-header">BỎ LỠ DỰ ĐOÁN</div>
            <div className="box-price">30 bánh</div>
            <div className="box-desc">Nếu trận đấu đã bắt đầu hoặc đã có kết quả mà người chơi chưa thực hiện bình chọn, hệ thống sẽ tự động tính là <strong>dự đoán sai</strong> và đóng góp <strong>30 bánh lương khô</strong>.</div>
          </div>
        </div>
      </section>

      {/* Section 2: Asian Handicap Explanation */}
      <section className="rules-section-card glass-card">
        <h2 className="section-title">
          <Compass size={22} color="#00d2ff" /> ⚽ Giải Thích Về Kèo Chấp (Asian Handicap)
        </h2>
        <div className="info-badge-rules">
          <ShieldAlert size={16} />
          <span>Kèo chấp ngăn ngừa việc mọi người chỉ tập trung chọn các đội mạnh!</span>
        </div>

        <p className="rules-text">
          Đội mạnh hơn là <strong>Cửa trên</strong> (được ký hiệu dấu trừ, ví dụ: <span className="highlight-tag favorite">-0.5</span> hoặc <span className="highlight-tag favorite">-1</span>). Đội yếu hơn là <strong>Cửa dưới</strong> (được ký hiệu dấu cộng, ví dụ: <span className="highlight-tag underdog">+0.5</span> hoặc <span className="highlight-tag underdog">+1</span>).
        </p>

        <h3 className="sub-title">Công thức tính thắng/thua kèo:</h3>
        <div className="formula-box">
          <div className="formula-step">
            <span className="step-num">1</span>
            <span className="step-text">Lấy số bàn thắng thực tế của hai đội.</span>
          </div>
          <div className="formula-arrow"><ArrowRight size={16} /></div>
          <div className="formula-step">
            <span className="step-num">2</span>
            <span className="step-text">Trừ đi tỷ lệ chấp từ số bàn thắng của đội cửa trên.</span>
          </div>
          <div className="formula-arrow"><ArrowRight size={16} /></div>
          <div className="formula-step">
            <span className="step-num">3</span>
            <span className="step-text">So sánh hiệu số bàn thắng còn lại để xác định đội thắng kèo.</span>
          </div>
        </div>
      </section>

      {/* Section 3: Visual Examples */}
      <section className="rules-section-card glass-card">
        <h2 className="section-title">
          <Award size={22} color="#a855f7" /> 📊 Minh Họa Bằng Ví Dụ Thực Tế
        </h2>

        <div className="examples-list">
          {/* Example 1 */}
          <div className="example-item">
            <div className="example-badge">Ví dụ 1</div>
            <h4>Kèo chấp 1 Trái (Chấp 1.0) — Đức chấp Curacao (-1)</h4>
            <p className="example-context">Bạn chọn Đức (Cửa trên). Trận đấu kết thúc với tỷ số thực tế: <strong>Đức 2 - 1 Curacao</strong>.</p>

            <div className="visual-math-panel">
              <div className="math-col">
                <span className="math-lbl">Đức (Cửa trên)</span>
                <span className="math-val">2 bàn - 1 chấp = <strong>1.0</strong></span>
              </div>
              <div className="math-vs">vs</div>
              <div className="math-col">
                <span className="math-lbl">Curacao (Cửa dưới)</span>
                <span className="math-val"><strong>1.0</strong></span>
              </div>
            </div>

            <div className="example-result-box warning">
              <strong>KẾT QUẢ: HÒA KÈO (1.0 vs 1.0)</strong>
              <p>Hiệu số sau chấp bằng nhau (Hòa kèo). Chỉ người dự đoán cửa **HÒA** mới được tính **ĐÚNG** ➔ Đóng góp **10 bánh**. Những người chọn Đức hoặc Curacao đều tính **SAI** ➔ Đóng góp **30 bánh**.</p>
            </div>
          </div>

          {/* Example 2 */}
          <div className="example-item">
            <div className="example-badge">Ví dụ 2</div>
            <h4>Kèo chấp Nửa Trái (Chấp 0.5) — Đức chấp Curacao (-0.5)</h4>
            <p className="example-context">Trận đấu kết thúc với tỷ số thực tế: <strong>Đức 1 - 1 Curacao</strong> (Tỷ số hòa).</p>

            <div className="visual-math-panel">
              <div className="math-col">
                <span className="math-lbl">Đức (Cửa trên)</span>
                <span className="math-val">1 bàn - 0.5 chấp = <strong>0.5</strong></span>
              </div>
              <div className="math-vs">vs</div>
              <div className="math-col">
                <span className="math-lbl">Curacao (Cửa dưới)</span>
                <span className="math-val"><strong>1.0</strong></span>
              </div>
            </div>

            <div className="example-result-box wrong">
              <strong>KẾT QUẢ: CỬA DƯỚI THẮNG KÈO (0.5 vs 1.0)</strong>
              <p>Người chọn Curacao (Cửa dưới) thắng ➔ Đóng góp **10 bánh**. Người chọn Đức (Cửa trên) hoặc Hòa thua ➔ Đóng góp **30 bánh**.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: How to Play */}
      <section className="rules-section-card glass-card">
        <h2 className="section-title">
          <HelpCircle size={22} color="#00ff64" /> 🛠 Hướng Dẫn Cách Đặt Cược (Bet)
        </h2>

        <div className="instructions-timeline">
          <div className="instruction-step">
            <div className="step-indicator">1</div>
            <div className="step-content">
              <h4>Chọn Trận Đấu</h4>
              <p>Truy cập trang chủ để xem lịch thi đấu và tỷ lệ kèo chấp tương ứng được hiển thị trên mỗi thẻ trận đấu.</p>
            </div>
          </div>

          <div className="instruction-step">
            <div className="step-indicator">2</div>
            <div className="step-content">
              <h4>Bình Chọn Cửa Cược</h4>
              <p>Click chọn 1 trong 3 cửa: <strong>Tên Đội 1</strong> (Chọn Đội 1 thắng kèo), <strong>HÒA</strong> (Chọn kết quả hòa), hoặc <strong>Tên Đội 2</strong> (Chọn Đội 2 thắng kèo).</p>
            </div>
          </div>

          <div className="instruction-step">
            <div className="step-indicator">3</div>
            <div className="step-content">
              <h4>Chốt Kèo Trước Trận</h4>
              <p>Xác nhận bình chọn để chốt. Hệ thống sẽ tự động <strong>khóa chốt cược</strong> ngay khi trận đấu đến giờ bắt đầu. Mọi bình chọn sau đó đều không hợp lệ.</p>
            </div>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        .rules-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 100px 20px 150px;
        }

        .rules-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .rules-header-icon {
          width: 64px;
          height: 64px;
          background: rgba(0, 210, 255, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          border: 1px solid rgba(0, 210, 255, 0.2);
          color: #00d2ff;
        }

        .rules-header h1 {
          font-size: 2rem;
          font-weight: 900;
          color: white;
          margin-bottom: 5px;
        }

        .rules-header p {
          color: #64748b;
          font-weight: 600;
        }

        .glass-card {
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
          padding: 25px;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 1.2rem;
          font-weight: 900;
          color: white;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-intro {
          color: #94a3b8;
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .penalty-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .penalty-box {
          border-radius: 16px;
          padding: 20px;
          border: 1px solid transparent;
        }
        .penalty-box.correct {
          background: rgba(52, 211, 153, 0.03);
          border-color: rgba(52, 211, 153, 0.12);
        }
        .penalty-box.wrong {
          background: rgba(239, 68, 68, 0.03);
          border-color: rgba(239, 68, 68, 0.12);
        }
        .penalty-box.missed {
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.2);
        }

        .box-header {
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }
        .penalty-box.correct .box-header { color: #34d399; }
        .penalty-box.wrong .box-header { color: #f87171; }
        .penalty-box.missed .box-header { color: #f87171; }

        .box-price {
          font-size: 2rem;
          font-weight: 900;
          font-family: 'Outfit', sans-serif;
          margin-bottom: 12px;
        }
        .penalty-box.correct .box-price { color: #00ff64; }
        .penalty-box.wrong .box-price { color: #ff4d4d; }
        .penalty-box.missed .box-price { color: #ff4d4d; }

        .box-desc {
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.5;
        }
        .box-desc strong {
          color: white;
        }

        .info-badge-rules {
          background: rgba(0, 210, 255, 0.08);
          border: 1px solid rgba(0, 210, 255, 0.15);
          color: #00d2ff;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 8px 12px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
        }

        .rules-text {
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .highlight-tag {
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
        }
        .highlight-tag.favorite { background: rgba(0, 210, 255, 0.15); color: #00d2ff; }
        .highlight-tag.underdog { background: rgba(0, 255, 100, 0.15); color: #00ff64; }

        .sub-title {
          font-size: 0.9rem;
          font-weight: 800;
          color: white;
          margin-bottom: 12px;
        }

        .formula-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 0, 0, 0.2);
          padding: 15px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.03);
          gap: 10px;
        }

        .formula-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
        }

        .step-num {
          width: 24px;
          height: 24px;
          background: #00d2ff;
          border-radius: 50%;
          color: black;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
        }

        .step-text {
          font-size: 0.7rem;
          color: #64748b;
          font-weight: 700;
        }

        .formula-arrow {
          color: rgba(255,255,255,0.1);
        }

        /* Examples */
        .examples-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .example-item {
          background: rgba(255,255,255,0.015);
          border: 1px solid rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 18px;
          position: relative;
        }

        .example-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(168, 85, 247, 0.15);
          color: #c084fc;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .example-item h4 {
          font-size: 0.95rem;
          font-weight: 800;
          color: white;
          margin-bottom: 8px;
          padding-right: 60px;
        }

        .example-context {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 15px;
        }

        .visual-math-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          background: rgba(0,0,0,0.15);
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 15px;
        }

        .math-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .math-lbl {
          font-size: 0.65rem;
          color: #475569;
          font-weight: 800;
        }

        .math-val {
          font-size: 0.85rem;
          color: #e2e8f0;
          font-weight: 700;
        }
        .math-val strong {
          color: #00d2ff;
        }

        .math-vs {
          font-size: 0.7rem;
          font-weight: 900;
          color: rgba(255,255,255,0.1);
        }

        .example-result-box {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.8rem;
          border: 1px solid transparent;
        }
        .example-result-box.warning {
          background: rgba(234, 179, 8, 0.04);
          border-color: rgba(234, 179, 8, 0.15);
          color: #fbbf24;
        }
        .example-result-box.wrong {
          background: rgba(239, 68, 68, 0.04);
          border-color: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .example-result-box strong {
          display: block;
          font-weight: 900;
          margin-bottom: 4px;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
        }
        .example-result-box p {
          margin: 0;
          color: #94a3b8;
        }

        /* Timeline instructions */
        .instructions-timeline {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .instruction-step {
          display: flex;
          gap: 15px;
          align-items: flex-start;
        }

        .step-indicator {
          width: 28px;
          height: 28px;
          background: rgba(0, 255, 100, 0.1);
          border: 1px solid rgba(0, 255, 100, 0.25);
          color: #00ff64;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.8rem;
          flex-shrink: 0;
        }

        .step-content h4 {
          font-size: 0.9rem;
          font-weight: 800;
          color: white;
          margin-bottom: 4px;
        }

        .step-content p {
          font-size: 0.8rem;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 768px) {
          .rules-container {
            padding-top: 80px;
            padding-bottom: 100px;
          }
          .penalty-grid {
            grid-template-columns: 1fr;
          }
          .formula-box {
            flex-direction: column;
            gap: 15px;
          }
          .formula-arrow {
            transform: rotate(90deg);
            margin: 5px 0;
          }
        }
      `}} />
    </div>
  );
};

export default RulesView;
