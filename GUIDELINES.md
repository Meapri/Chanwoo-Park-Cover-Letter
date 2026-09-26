# Prism Glass integration guidelines

- 실제 굴절에는 명시적인 원본이 필요합니다. 포트폴리오 헤더는 `.prism-scroll-source`의 실제 DOM을 원본으로 사용합니다.
- 헤더의 링크·버튼을 source filter 안으로 옮기지 마세요. 전경 레이어에 두어 읽기와 상호작용을 보존합니다.
- 긴 문서 전체 높이를 source로 만들지 마세요. 화면 높이의 스크롤 컨테이너로 필터 범위를 제한합니다.
- 카드와 버튼은 중첩 렌즈를 추가하지 않고 해당 용도의 Prism material preset 하나만 사용합니다.
- `data-prism-source-state`가 `limited`, `disabled`, `error`일 때 solid material fallback을 유지합니다.
- `prefers-reduced-transparency`, `prefers-contrast`, `forced-colors`를 무시하지 마세요.
- Prism의 공개 import만 사용하고 vendored tarball을 수정하지 마세요. 버전을 올릴 때 tarball SHA-256과 README를 함께 갱신합니다.
- 변경 후 `npm test`와 Chromium·WebKit 렌더링 검증을 수행합니다.
