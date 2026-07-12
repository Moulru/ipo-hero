import { useStore } from '../store'
import { useBackClose } from '../lib/backStack'

// 첫 실행 1회 웰컴 — 앱 정체성(정보 앱) + 가상머니 면책 고지. '시작하기'로 닫음.
export function Welcome() {
  const setWelcomed = useStore((s) => s.setWelcomed)
  useBackClose(setWelcomed)

  return (
    <div className="welcome-overlay">
      <div className="welcome">
        <div className="wl-logo">📈</div>
        <h1>공모주 히어로</h1>
        <p className="wl-tag">공모주 정보를 쉽고 빠르고 편리하게</p>

        <div className="wl-points">
          <div className="wl-point">
            <span className="wl-ico">🗓️</span>
            <div>
              <b>오늘 브리핑 · 청약 캘린더</b>
              <span>앱을 열면 오늘 마감·시작·상장이 바로 보여요</span>
            </div>
          </div>
          <div className="wl-point">
            <span className="wl-ico">📊</span>
            <div>
              <b>수요 지표 · 예상 배정</b>
              <span>경쟁률·의무확약 기반 정보를 한눈에</span>
            </div>
          </div>
          <div className="wl-point">
            <span className="wl-ico">🎮</span>
            <div>
              <b>가상 모의투자 (선택)</b>
              <span>가상머니로 예측하고 실제 결과로 정산 연습</span>
            </div>
          </div>
        </div>

        <button className="cta" onClick={setWelcomed}>
          시작하기
        </button>
        <p className="wl-foot">
          본 앱은 정보 제공·가상 시뮬레이션용이며 투자 자문·권유가 아니에요.
          <br />
          개인정보를 수집하지 않아요.
        </p>
      </div>
    </div>
  )
}
