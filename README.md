# Chanwoo Park - Liquid Glass Portfolio

박찬우의 GitHub Pages 포트폴리오이자, 웹용 Liquid Glass 엔진을 실제 페이지에 적용한 데모 저장소입니다.
브라우저 확장, 렌더링 엔진, macOS 입력기, AI provider 어댑터, 로컬 AI 런타임, Android/Linux 실행 환경, 데이터 파이프라인처럼 서로 다른 플랫폼의 제약을 다룬 프로젝트를 한곳에서 볼 수 있도록 구성했습니다.

Live: [https://meapri.github.io/Chanwoo-Park-Cover-Letter/](https://meapri.github.io/Chanwoo-Park-Cover-Letter/)

## Overview

이 저장소는 두 가지 역할을 함께 갖습니다.

- 채용 담당자와 동료 개발자가 박찬우의 대표 프로젝트를 빠르게 훑어볼 수 있는 정적 포트폴리오
- 카드, 버튼, 태그 칩, 상세 설명 블록에 Liquid Glass 렌더링을 적용한 웹 엔진 데모

홈 화면은 프로젝트를 넓게 소개하고, 각 프로젝트 카드는 별도 상세 페이지로 이동합니다.
상세 페이지는 문제 상황, 설계 방향, 구현 포인트, 주요 파일, 엔지니어링 관점을 같은 형식으로 정리해 코드베이스를 읽기 쉽게 만듭니다.

프로젝트 선정은 공개 저장소 전체를 훑은 뒤, 백업성 저장소나 원본 대비 변화가 적은 단순 보관 fork는 제외하고 직접 구현한 구조가 분명한 저장소 위주로 구성했습니다.

## Featured Projects

| Project | What It Shows |
| --- | --- |
| EdgeTranslate-v3 | Manifest V3 확장 안에서 여러 번역 provider, IndexedDB 캐시, 페이지 DOM 변화, 결과 패널 UX를 함께 다루는 구조 |
| liquid-glass-web | SVG filter, WebGL refraction, displacement/specular map, 자동 profile을 조합한 웹 Liquid Glass 엔진 |
| PriType-Swift | macOS InputMethodKit과 libhangul을 연결해 한글 조합 상태, 후보창, 앱별 입력 예외를 다루는 네이티브 IME |
| Hermes Antigravity | Google Antigravity provider를 Hermes 흐름에 연결하며 streaming event, tool-call id, schema 차이를 정규화하는 Python 어댑터 |
| MLX/VLM Experiments | MLX-Swift 계열 코드에서 모델 로드, 멀티모달 입력, KV cache, OpenAI/Ollama 호환 API 경계를 분석한 실험 |
| Plib | Android app-private 공간에서 Linux/glibc arm64 런타임, rootfs 설치, JNI 진단, EGL/GLES bridge를 나누어 검증한 실험 |
| Gemini Writing Copilot | Codex의 글쓰기 요청을 Gemini/Antigravity로 라우팅하며 task/profile/project context/quality gate를 조합하는 개인 플러그인 |
| AndroLinux Runtime Lab | Android 앱 전용 공간에서 manifest 검증, 안전한 rootfs 추출, packaged PRoot 실행, EGL/GLES 진단을 나누어 검증한 Kotlin/NDK 랩 |
| Gemma4 Swift MTP Server | MLX 모델을 OpenAI 호환 HTTP/SSE API로 감싸고 Gemma4 MTP, Qwen DFlash draft path, on-demand backend proxy를 다루는 Swift 서버 |
| mlx-swift-lm-gemma4-mtp | Gemma4 assistant, DFlash draft model, Qwen3.5 계열 등록과 tool parser를 추가한 MLX Swift 확장 |
| LibHangul Swift/Linux | 한글 조합 상태 머신, backspace 분해, Unicode 정규화, thread-safe IME wrapper, sorted-array Hanja Trie를 담은 Swift 입력기 코어 |
| Event Log Pipeline | deterministic event generation, PostgreSQL 적재, SQL aggregate, dashboard export를 Docker Compose로 묶은 데이터 파이프라인 |

## Tech Stack

| Layer | Used For |
| --- | --- |
| TypeScript | Liquid Glass 엔진 코어, 자동 profile 해석, DOM 인스턴스 초기화 |
| Vite | 로컬 개발 서버, GitHub Pages용 정적 빌드 |
| CSS | 반응형 레이아웃, 배경 장면, 타이포그래피, fallback 스타일 |
| SVG / WebGL | `feDisplacementMap`, refraction, displacement/specular map 렌더링 |
| Python / PostgreSQL | 이벤트 로그 생성, 적재, SQL 집계, dashboard export |
| Swift / MLX | 로컬 LLM 모델 로딩, MTP draft verification, OpenAI 호환 SSE 서버 |
| GitHub Actions | `npm ci` → `typecheck` → `build` → GitHub Pages 배포 |

## Liquid Glass Engine

페이지의 주요 UI 요소는 `data-glass` 속성으로 엔진 옵션을 선언합니다.
`demo/demo.ts`가 `[data-glass]` 요소를 스캔하고 `new LiquidGlass(element, options)` 인스턴스를 생성합니다.

```html
<article
  class="project-card liquid-glass lg-interactive"
  data-glass='{"profile":"auto","preset":"auto","scheme":"light","radius":28}'
>
  <!-- project content -->
</article>
```

엔진은 단순한 반투명 배경이 아니라 요소별 필터와 맵을 만들어 유리 소재의 굴절과 가장자리 반응을 표현합니다.

- `AutoProfile`은 요소 크기, radius, 역할을 읽어 `bar`, `control`, `card`, `panel`, `selection` 계열 profile을 선택합니다.
- `LiquidGlass`는 profile, preset, DPR, radius, 품질 설정을 바탕으로 요소에 맞는 필터 생명주기를 관리합니다.
- `FilterChain`은 SVG `feImage`, `feDisplacementMap`, specular map을 조합해 가장자리 굴절감을 만듭니다.
- `MapRaster`, `MapWorker`, `MapWorkerClient`는 displacement/specular map 생성을 worker 경로로 분리해 런타임 부하를 줄입니다.
- `ObserverRegistry`는 resize/intersection observer를 공유해 glass 요소가 많을 때 관찰 비용을 낮춥니다.
- `DeviceProfile`과 `quality: "auto"` 흐름은 모바일, Android, 저성능 환경에서 효과 비용을 조정합니다.
- `MapCache`는 같은 조건의 맵을 재사용해 초기화 비용을 줄입니다.
- 비지원 환경이나 reduced transparency 조건에서는 CSS fallback filter로 내려갑니다.

현재 포트폴리오의 클릭 가능한 요소는 커서 위치를 따라 기하학적으로 기울어지는 pointer tilt를 사용하지 않습니다.
대신 hover, focus, active 상태의 glass highlight만 유지합니다.

## Repository Structure

```text
.
├── index.html                    # 포트폴리오 홈
├── projects/                     # 대표 프로젝트 상세 페이지
├── demo/
│   ├── demo.ts                   # data-glass 스캔 및 LiquidGlass 초기화
│   ├── styles.css                # 페이지 레이아웃과 glass 적용 스타일
│   └── assets/                   # 배경 이미지와 프로필 이미지
├── src/
│   ├── index.ts                  # 엔진 공개 export
│   └── core/                     # LiquidGlass, profile, filter, worker, observer 로직
├── tests/
│   ├── auto-profile.mjs          # 자동 profile 결정 테스트
│   └── auto-quality.mjs          # 기기 품질 자동 조절 테스트
├── vite.config.ts                # GitHub Pages base 포함 데모 빌드 설정
├── vite.lib.config.ts            # Liquid Glass 라이브러리 빌드 설정
└── .github/workflows/deploy.yml  # Pages 배포 워크플로
```

## Local Development

```bash
npm ci
npm run dev
```

개발 서버는 Vite 기본 포트인 `5173`을 사용합니다.

```text
http://127.0.0.1:5173/Chanwoo-Park-Cover-Letter/
```

자주 쓰는 명령은 아래와 같습니다.

```bash
npm run typecheck      # TypeScript 타입 체크
npm run build          # GitHub Pages용 정적 빌드(dist-demo)
npm run preview        # 빌드 결과 미리보기
npm run build:lib      # Liquid Glass 라이브러리 빌드
npm test               # typecheck + auto-profile/auto-quality 테스트
```

## Deployment

배포는 `.github/workflows/deploy.yml`에서 관리합니다.
`main` 브랜치에 push하면 GitHub Actions가 Node 환경을 준비하고, 의존성 설치, 타입 체크, 정적 빌드를 거쳐 `dist-demo`를 GitHub Pages artifact로 배포합니다.

Vite `base`는 `/Chanwoo-Park-Cover-Letter/`로 설정되어 Pages 하위 경로에서도 정적 자산이 올바르게 로드됩니다.

## Verification Checklist

커밋 전 기본 확인:

```bash
npm run build
npm test
```

렌더링 확인 항목:

- 첫 화면이 비어 있지 않고 Vite 오류 오버레이가 없어야 합니다.
- `.scene-image`는 배경 워크스테이션 이미지를 유지해야 합니다.
- `.profile-photo`는 프로필 카드 안에서만 로드되어야 합니다.
- 프로젝트 카드, 태그 칩, 상세 페이지 요약 블록은 `data-glass` 기반으로 LiquidGlass 인스턴스가 생성되어야 합니다.
- `.lg-interactive` 요소는 hover 중에도 커서 위치를 따라 이동하거나 기울어지지 않아야 합니다.
- 콘솔에 glass 초기화, asset loading, routing 관련 error/warn이 없어야 합니다.

## License

MIT
