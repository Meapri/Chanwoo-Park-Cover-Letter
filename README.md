# Chanwoo Park — Prism Glass Portfolio

박찬우의 소프트웨어 엔지니어 포트폴리오입니다. 13개 정적 라우트가 프로젝트 경험을 같은 구조로 소개하며, 공통 인터페이스는 [`@meapri/prism-glass`](https://github.com/Meapri/prism-glass)를 사용합니다.

Live: [https://meapri.github.io/Chanwoo-Park-Cover-Letter/](https://meapri.github.io/Chanwoo-Park-Cover-Letter/)

## Rendering structure

헤더와 본문은 서로 다른 레이어입니다.

1. `.prism-scroll-source`는 현재 화면 크기의 실제 본문 DOM과 배경 장면을 담고 스크롤합니다.
2. Prism `createGlass()`는 이 원본에 헤더 크기의 `navigation` 렌즈만 적용합니다.
3. `.site-nav`의 링크와 버튼은 별도 전경에 남아 선명도, 키보드 탐색, 클릭 동작을 유지합니다.
4. 카드·버튼·칩은 Prism의 용도별 material preset을 사용합니다.

이 구조는 DOM 복제, 화면 캡처, `html2canvas`를 사용하지 않습니다. 헤더 뒤를 지나가는 실제 본문 픽셀이 SVG source filter로 굴절됩니다. 원본이 16M 픽셀 예산을 넘거나 사용자가 투명도 감소/고대비를 요청하면 헤더는 읽기 가능한 solid material로 내려갑니다.

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
│   ├── demo.ts                   # Prism material 및 헤더 source refraction 어댑터
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

- `.site-nav[data-prism-source-state="ready"]`와 `svg-source-selected`
- 헤더 안쪽의 실제 본문 픽셀 변화와 헤더 밖 원본 보존
- 프로젝트 앵커, KR/EN 전환, 카드 상세 이동
- 390px 모바일에서 가로 overflow가 없는지
- Chromium·WebKit 콘솔에 관련 error/warn이 없는지

## Deployment

`main`에 push하면 GitHub Actions가 `npm ci`, 타입 검사, production build를 실행하고 `dist-demo`를 GitHub Pages에 배포합니다.

## License

MIT
