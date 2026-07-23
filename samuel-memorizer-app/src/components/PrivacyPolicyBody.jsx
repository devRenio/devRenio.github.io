export default function PrivacyPolicyBody() {
  return (
    <div className="privacy-body">
      <h4>1. 수집하는 정보</h4>
      <ul>
        <li>
          <strong>깨사모 로그인</strong>: 깨사모 API를 통해 이름·성별·교회·
          이메일 등 회원 프로필 조회, 문의(쪽지) 발송 시 로그인 세션 사용
        </li>
        <li>
          <strong>서비스 가입 동의 시</strong>: 사무엘학교 암송 도우미 운영을
          위해 이름·성별·교회·프로필 사진 URL 등 회원 프로필 정보를 BFF
          서버에 저장하며, 관리자는 참여 회원 목록을 확인할 수 있습니다.
          (사진 파일은 깨사모 서버에 있으며, URL만 저장합니다.)
        </li>
      </ul>

      <h4>2. 이용 목적</h4>
      <ul>
        <li>깨사모 계정으로 로그인 및 본인 확인</li>
        <li>앱 내 문의(쪽지) 발송</li>
        <li>사무엘학교 암송 도우미 운영 및 참여 회원 관리</li>
      </ul>

      <h4>3. 보관·처리</h4>
      <ul>
        <li>암송 진행·설정은 기기 localStorage에 저장됩니다.</li>
        <li>
          로그인 세션은 BFF 서버의 HttpOnly 쿠키로 관리되며, JavaScript에서
          읽을 수 없습니다.
        </li>
        <li>
          가입 동의 후 회원 프로필은 BFF 서버(Cloudflare KV)에 저장됩니다.
        </li>
        <li>회원 프로필·쪽지는 선교회(깨사모) API 서버에서 처리됩니다.</li>
      </ul>

      <h4>4. 제3자 제공</h4>
      <p>수집 정보를 마케팅 등 목적으로 제3자에게 제공하지 않습니다.</p>

      <h4>5. 이용자 권리</h4>
      <ul>
        <li>로그아웃으로 이 기기의 로그인 세션을 해제할 수 있습니다.</li>
        <li>문의: 정보 메뉴 → 문의하기(깨사모 쪽지)</li>
      </ul>

      <p className="privacy-note">
        본 안내는 서비스 이용에 적용되는 개인정보처리방침입니다.
      </p>
    </div>
  );
}
