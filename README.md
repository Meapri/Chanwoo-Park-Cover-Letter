# Chanwoo Park — Prism Glass Portfolio

박찬우의 소프트웨어 엔지니어 포트폴리오입니다. 13개 정적 라우트가 프로젝트 경험을 같은 구조로 소개하며, 공통 인터페이스는 [`@meapri/prism-glass`](https://github.com/Meapri/prism-glass)를 사용합니다.

Live: [https://meapri.github.io/Chanwoo-Park-Cover-Letter/](https://meapri.github.io/Chanwoo-Park-Cover-Letter/)

## Rendering structure

배경 source, Clear 렌즈, 콘텐츠는 서로 다른 레이어입니다.

1. `.scene-image`는 화면에 보이는 고정 배경이자 Prism의 명시적인 image source입니다.
2. `createMediaGlass()`는 하나의 고정 WebGL canvas에서 현재 화면에 보이는 헤더·카드·패널·버튼을 함께 굴절합니다.
3. 각 표면은 용도별 preset과 `clear` variant를 사용하며, 큰 카드의 광학 강도는 읽기 가능한 범위로 제한합니다.
4. 텍스트·링크·버튼은 canvas 위의 일반 HTML 전경에 남아 선명도, 키보드 탐색, 클릭 동작을 유지합니다.
5. 이미 Clear 표면 안에 있는 버튼과 칩은 중첩 굴절을 만들지 않고 overlay 재질을 사용합니다.

이 구조는 DOM 복제, 화면 캡처, `html2canvas`를 사용하지 않습니다. 샘플 페이지와 같은 공유 media renderer가 실제 배경 이미지 픽셀을 각 Clear 표면 안에서 굴절합니다. WebGL을 사용할 수 없거나 사용자가 투명도 감소·고대비를 요청하면 읽기 가능한 CSS/solid material로 내려갑니다.

## Package pin

Prism Glass `0.5.0-alpha.2` 패키지는 아직 npm registry에 게시되지 않았습니다. CI에서 재현 가능하도록 검증된 tarball을 저장소에 고정합니다.

```text
vendor/meapri-prism-glass-0.5.0-alpha.2.tgz
SHA-256 6399b126b130506bea1159b60b4981efc5d8aa6ba7fb066ff8fd3af32757dbba
```

`package-lock.json`은 이 로컬 artifact를 `@meapri/prism-glass`로 설치합니다. tarball 내부에 MIT 라이선스와 배포 파일이 함께 들어 있습니다.

## Repository structure

```text
.
├── index.html                    # 포트폴리오 홈
├── projects/                     # 12개 프로젝트 상세 페이지
├── demo/
│   ├── demo.ts                   # 공유 media renderer와 Clear surface 어댑터
│   ├── styles.css                # 페이지 레이아웃과 레이어 구조
│   └── assets/                   # 배경·프로필 이미지
├── vendor/                       # 고정된 Prism Glass 설치 artifact
├── vite.config.ts                # 13개 route와 GitHub Pages base
└── .github/workflows/deploy.yml  # typecheck/build/Pages 배포
```

## Local development

Node.js 20 이상에서 실행합니다.

```bash
npm ci
npm run dev
```

기본 URL은 `http://127.0.0.1:5173/Chanwoo-Park-Cover-Letter/`입니다.

```bash
npm run typecheck
npm run build
npm test
```

`npm test`는 타입 검사와 13개 라우트의 production build를 수행합니다. 렌더링 QA에서는 다음 동작도 확인해야 합니다.

- `.background-scene`과 `.prism-page-media-canvas`는 스크롤 컨테이너 밖의 고정 형제 레이어이며, `main`과 footer만 `.prism-scroll-source` 안에서 이동
- `.prism-page-media-canvas[data-prism-state="ready"]`와 `webgl-media-selected`
- 헤더와 현재 보이는 본문 표면의 `data-variant="clear"`, `data-prism-renderer="webgl-media"`
- canvas 활성/비활성 비교에서 각 표면 내부 픽셀 변화와 표면 밖 원본 보존
- 프로젝트 앵커, KR/EN 전환, 카드 상세 이동
- 390px 모바일에서 가로 overflow가 없는지
- Chromium·WebKit 콘솔에 관련 error/warn이 없는지

## Deployment

`main`에 push하면 GitHub Actions가 `npm ci`, 타입 검사, production build를 실행하고 `dist-demo`를 GitHub Pages에 배포합니다.

## License

MIT
