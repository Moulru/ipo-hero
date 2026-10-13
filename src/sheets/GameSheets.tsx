import { useStore } from '../store'
import { Sheet } from '../ui/Sheet'
import { Emoji } from '../ui/Emoji'
import { PixelSprite } from '../game/Battle'
import { FARM_RETRY_KILLS, OFFLINE_CAP_SEC, OFFLINE_EFFICIENCY, fmtBig } from '../game/balance'
import { SPRITES } from '../game/sprites'

const PARTY = ['slime', 'bat', 'mushroom', 'goblin', 'skeleton', 'ghost', 'bear', 'golem', 'witch', 'dragon']

// 2.0 첫 진입 소개 (기존 사용자는 이전 등급 보상 안내)
export function IntroSheet() {
  const legacy = useStore((s) => s.rpg.legacy)
  const close = useStore((s) => s.rpgCloseIntro)
  return (
    <Sheet
      onClose={close}
      footer={(c) => (
        <button className="btn btn-primary btn-lg" onClick={c}>
          시작하기
        </button>
      )}
    >
      <div className="intro">
        <div className="intro-art">
          <PixelSprite kind="knight" size={96} />
          <span className="intro-vs">VS</span>
          <PixelSprite kind="dragon" size={96} />
        </div>
        <h2 className="intro-title">라운지가 방치형 RPG로 바뀌었어요</h2>
        <p className="intro-desc">기사가 알아서 몬스터와 싸우며 스테이지를 올라가요. 앱을 닫아 둔 동안에도 골드가 모여요.</p>
        <ul className="intro-list">
          <li>
            <Emoji e="⚔️" size={22} />
            <span>몬스터를 잡아 모은 골드로 공격력, 방어력, 체력을 올려요</span>
          </li>
          <li>
            <Emoji e="💰" size={22} />
            <span>모의청약으로 시즌 자산이 늘면 능력치도 함께 올라가요</span>
          </li>
          <li>
            <Emoji e="🚩" size={22} />
            <span>투자자 등급은 이제 최고 스테이지로 정해져요</span>
          </li>
        </ul>
        {legacy > 0 && (
          <div className="callout brand">
            <Emoji e="🎁" size={22} />
            <span>이전 등급에 맞춰 {fmtBig(legacy)}골드를 드렸어요.</span>
          </div>
        )}
      </div>
    </Sheet>
  )
}

export function BattleHelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet
      title="라운지 전투 안내"
      onClose={onClose}
      footer={(c) => (
        <button className="btn btn-primary btn-lg" onClick={c}>
          확인
        </button>
      )}
    >
      <div className="glossary">
        <div className="gl-item">
          <div className="gl-title">
            <Emoji e="🗺️" size={22} />
            무한 스테이지
          </div>
          <p className="gl-body">
            스테이지마다 몬스터가 한 마리씩 나오고, 갈수록 강해져요. 10스테이지마다 보스가 나오고 지역이 바뀌어요. 지면 한 스테이지 뒤로
            물러나 골드를 모으고, 자동 재도전을 켜 두면 {FARM_RETRY_KILLS}마리를 잡은 뒤 다시 도전해요.
          </p>
        </div>
        <div className="gl-item">
          <div className="gl-title">
            <Emoji e="💰" size={22} />
            시즌 자산 배율
          </div>
          <p className="gl-body">
            모든 능력치에 √(시즌 자산 ÷ 1,000만원)만큼 배율이 붙어요. 최소 0.5배, 최대 3배이고, 2,000만원이면 약 1.41배, 4,000만원이면
            2배예요. 전투 결과는 시즌 자산과 모의청약에 영향을 주지 않아요.
          </p>
        </div>
        <div className="gl-item">
          <div className="gl-title">
            <Emoji e="🗂️" size={22} />
            카드 도감 · 카드 효과
          </div>
          <p className="gl-body">
            새 카드를 모을 때마다 전체 능력치가 커먼 1%, 레어 2%, 에픽 4%, 레전더리 8%씩 올라요. ‘공격력 +’, ‘골드 획득 +’ 효과가 있는
            카드는 그 효과도 함께 적용돼요.
          </p>
        </div>
        <div className="gl-item">
          <div className="gl-title">
            <Emoji e="🌙" size={22} />
            자리를 비운 동안
          </div>
          <p className="gl-body">
            앱을 닫아 둔 동안에도 최대 {OFFLINE_CAP_SEC / 3600}시간까지 몬스터를 잡아요. 효율은 {Math.round(OFFLINE_EFFICIENCY * 100)}%이고,
            스테이지는 앱을 열어 둘 때만 올라가요.
          </p>
        </div>
        <div className="gl-item">
          <div className="gl-title">
            <Emoji e="👆" size={22} />탭 공격
          </div>
          <p className="gl-body">전투 화면을 탭하면 공격력의 35%만큼 한 번 더 공격해요.</p>
        </div>
        <div className="gl-item">
          <div className="gl-title">몬스터 도감</div>
          <div className="party">
            {PARTY.map((k) => (
              <span key={k} className="party-mon">
                <PixelSprite kind={k} size={40} />
                <span>{SPRITES[k].name}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}

// 방치 보상 결과
export function OfflineSheet({ sec, kills, gold, onClose }: { sec: number; kills: number; gold: number; onClose: () => void }) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const capped = sec >= OFFLINE_CAP_SEC
  return (
    <Sheet
      onClose={onClose}
      footer={(c) => (
        <button className="btn btn-primary btn-lg" onClick={c}>
          확인
        </button>
      )}
    >
      <div className="intro">
        <div className="intro-art">
          <PixelSprite kind="knight" size={88} />
          <Emoji e="💰" size={64} />
        </div>
        <h2 className="intro-title">자리를 비운 동안 모은 골드예요</h2>
        <p className="intro-desc">
          {h > 0 ? `${h}시간 ` : ''}
          {m}분 동안 싸웠어요{capped ? '. 최대 8시간까지만 쌓여요' : ''}
        </p>
        <div className="offline-sum">
          <div>
            <span className="t3 fs13">처치한 몬스터</span>
            <b className="num">{kills.toLocaleString()}마리</b>
          </div>
          <div>
            <span className="t3 fs13">모은 골드</span>
            <b className="num t-orange">+{fmtBig(gold)}</b>
          </div>
        </div>
      </div>
    </Sheet>
  )
}
