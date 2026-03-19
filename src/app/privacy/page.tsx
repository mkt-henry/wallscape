'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md pt-safe-top border-b border-border/40">
        <div className="flex items-center px-4 h-14">
          <button onClick={() => router.back()} className="p-2 -ml-2 tap-highlight-none">
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-white font-semibold ml-2">개인정보처리방침</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-8 pb-safe-bottom pb-12">
        <div className="text-text-muted text-xs">최종 업데이트: 2025년 6월 1일</div>

        <Section title="1. 개인정보 수집 항목">
          <p>Wallscape(이하 &quot;서비스&quot;)는 회원가입 및 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.</p>
          <ul>
            <li><strong>필수:</strong> 이메일 주소, 사용자명(닉네임), 비밀번호</li>
            <li><strong>선택:</strong> 표시 이름, 프로필 사진, 자기소개, 웹사이트, 위치 정보</li>
            <li><strong>자동 수집:</strong> 서비스 이용 기록, 접속 IP, 기기 정보, 게시물 위치 정보(EXIF)</li>
          </ul>
        </Section>

        <Section title="2. 개인정보 수집 및 이용 목적">
          <ul>
            <li>회원 가입 및 본인 확인</li>
            <li>서비스 제공 및 개선 (게시물 업로드, 지도 기반 탐색, 소셜 기능)</li>
            <li>부정 이용 방지 및 서비스 보안 관리</li>
            <li>공지사항 전달 및 서비스 관련 문의 응대</li>
          </ul>
        </Section>

        <Section title="3. 개인정보 보유 및 이용 기간">
          <p>수집된 개인정보는 회원 탈퇴 시까지 보유하며, 탈퇴 후에는 지체 없이 파기합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 별도 보관합니다.</p>
          <ul>
            <li>계약 또는 청약 철회 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만 또는 분쟁 처리 기록: 3년 (전자상거래법)</li>
            <li>접속 로그: 3개월 (통신비밀보호법)</li>
          </ul>
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          <p>서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.</p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
          </ul>
        </Section>

        <Section title="5. 개인정보 처리 위탁">
          <p>서비스는 원활한 운영을 위해 아래와 같이 개인정보 처리 업무를 위탁합니다.</p>
          <ul>
            <li><strong>Supabase Inc.</strong> — 데이터베이스 및 인증 서비스 (미국)</li>
            <li><strong>Vercel Inc.</strong> — 서버 및 CDN 호스팅 (미국)</li>
          </ul>
        </Section>

        <Section title="6. 이용자의 권리">
          <p>이용자는 언제든지 아래의 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람 및 수정: 앱 내 &apos;프로필 편집&apos; 메뉴</li>
            <li>계정 삭제: 앱 내 &apos;설정 → 계정 삭제&apos; 또는 피드백/문의를 통한 요청</li>
            <li>개인정보 처리 관련 기타 문의: 아래 연락처로 문의</li>
          </ul>
        </Section>

        <Section title="7. 개인정보 보호를 위한 기술적 조치">
          <ul>
            <li>비밀번호 암호화 저장 (bcrypt)</li>
            <li>SSL/TLS를 통한 데이터 전송 암호화</li>
            <li>접근 권한 최소화 및 불필요한 개인정보 수집 금지</li>
            <li>Row Level Security(RLS)를 통한 데이터 접근 제어</li>
          </ul>
        </Section>

        <Section title="8. 위치 정보 수집">
          <p>게시물 업로드 시 사진의 EXIF 위치 정보 또는 기기의 위치 정보를 수집할 수 있습니다. 위치 정보는 게시물의 지도 표시 목적으로만 사용되며, 이용자가 공개 범위를 설정할 수 있습니다.</p>
        </Section>

        <Section title="9. 개인정보 처리방침 변경">
          <p>이 개인정보처리방침은 법령 및 서비스 정책의 변경에 따라 수정될 수 있으며, 변경 시 앱 내 공지 또는 이메일을 통해 안내합니다.</p>
        </Section>

        <Section title="10. 개인정보 보호 책임자 및 문의">
          <p>개인정보 관련 문의는 서비스 내 <strong>피드백/문의</strong> 기능을 통해 접수해 주세요.</p>
          <ul>
            <li>서비스명: Wallscape</li>
            <li>문의: 앱 내 피드백/문의 메뉴</li>
          </ul>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-white font-bold text-base">{title}</h2>
      <div className="text-text-secondary text-sm leading-relaxed space-y-2 [&_ul]:space-y-1.5 [&_ul]:pl-4 [&_ul]:list-disc [&_li]:leading-relaxed [&_strong]:text-white">
        {children}
      </div>
    </div>
  )
}
