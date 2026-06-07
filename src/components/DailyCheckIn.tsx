import { useStore } from '../store'
import { todayYmd } from '../lib/calc'
import { confetti, haptic, toast } from '../lib/juice'

export function DailyCheckIn() {
  const lastRewardClaim = useStore((s) => s.lastRewardClaim)
  const streak = useStore((s) => s.streak)
  const claimDailyReward = useStore((s) => s.claimDailyReward)
  const claimed = lastRewardClaim === todayYmd()
  const reward = 50 + Math.min(streak, 7) * 20

  return (
    <div className={claimed ? 'checkin claimed' : 'checkin'}>
      <div className="checkin-left">
        <div className="checkin-title">🔥 {streak}일 연속 출석</div>
        <div className="checkin-sub muted">{claimed ? '내일 또 받아요' : `오늘 출석 보상 ${reward}🪙`}</div>
      </div>
      <button
        className="checkin-btn"
        disabled={claimed}
        onClick={() => {
          claimDailyReward()
          haptic([10, 20, 10])
          confetti(['#ffb01f', '#ffd700'])
          toast(`출석 보상 +${reward}🪙`, '🎁')
        }}
      >
        {claimed ? '✓ 완료' : '받기'}
      </button>
    </div>
  )
}
