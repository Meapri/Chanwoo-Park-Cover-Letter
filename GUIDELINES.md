# Prism Glass integration guidelines

- 실제 굴절에는 명시적인 원본이 필요합니다. 포트폴리오는 `.scene-image`를 공유 media source로 사용합니다.
- media source와 canvas는 스크롤 컨테이너 밖의 같은 고정 viewport 좌표계에 둡니다. 스크롤할 때 두 레이어를 이동하거나 재부모화하지 마세요.
- 헤더·카드·패널·독립 버튼은 하나의 `.prism-page-media-canvas`에 Clear 렌즈로 등록합니다.
- 텍스트와 상호작용 요소는 canvas 위의 일반 HTML 전경에 두어 읽기와 키보드·포인터 동작을 보존합니다.
- Clear 표면 안의 버튼과 칩은 중첩 렌즈를 추가하지 않고 `overlay` 재질을 사용합니다.
- 큰 카드와 패널은 Clear variant를 유지하되 광학 강도를 낮춰 본문 가독성을 보존합니다.
- media renderer가 `fallback`, `disabled`, `error`일 때 CSS/solid material fallback을 유지합니다.
- `prefers-reduced-transparency`, `prefers-contrast`, `forced-colors`를 무시하지 마세요.
- Prism의 공개 import만 사용하고 vendored tarball을 수정하지 마세요. 버전을 올릴 때 tarball SHA-256과 README를 함께 갱신합니다.
- 변경 후 `npm test`와 Chromium·WebKit 렌더링 검증을 수행합니다.
