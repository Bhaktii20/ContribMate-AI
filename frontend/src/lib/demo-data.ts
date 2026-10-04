import { RepoRecommendation, IssueItem, ContributionPlan, RepoAnalysis } from './types';

export const DEMO_REPOS: RepoRecommendation[] = [
  {
    full_name: 'fastapi/fastapi',
    owner: 'fastapi',
    name: 'fastapi',
    description: 'FastAPI framework, high performance, easy to learn, fast to code, ready for production',
    language: 'Python',
    stars: 76500,
    forks: 6300,
    open_issues: 120,
    license: 'MIT',
    html_url: 'https://github.com/fastapi/fastapi',
    last_updated: '2026-09-28',
    match_score: 95,
    beginner_issue_count: 14,
    why_matched: [
      '✓ Python matches your primary skill profile',
      '✓ Highly structured codebase with rich docstrings',
      '✓ 14 active beginner-friendly documentation & typo issues',
      '✓ Excellent unit test suite with pytest'
    ]
  },
  {
    full_name: 'scikit-learn/scikit-learn',
    owner: 'scikit-learn',
    name: 'scikit-learn',
    description: 'scikit-learn: machine learning in Python. Simple and efficient tools for predictive data analysis.',
    language: 'Python',
    stars: 59800,
    forks: 25100,
    open_issues: 850,
    license: 'BSD-3-Clause',
    html_url: 'https://github.com/scikit-learn/scikit-learn',
    last_updated: '2026-09-30',
    match_score: 92,
    beginner_issue_count: 22,
    why_matched: [
      '✓ Matches your AI/ML domain interest and Python skills',
      '✓ Well-documented easy tag for first-time contributors',
      '✓ Modular estimator structure makes isolating fixes straightforward',
      '✓ Active community review process'
    ]
  },
  {
    full_name: 'huggingface/transformers',
    owner: 'huggingface',
    name: 'transformers',
    description: 'State-of-the-art Machine Learning for Pytorch, TensorFlow, and JAX.',
    language: 'Python',
    stars: 128000,
    forks: 24500,
    open_issues: 620,
    license: 'Apache-2.0',
    html_url: 'https://github.com/huggingface/transformers',
    last_updated: '2026-10-01',
    match_score: 91,
    beginner_issue_count: 18,
    why_matched: [
      '✓ Prime project for AI/ML interest and Python expertise',
      '✓ Active good first issue label community triage',
      '✓ Well-isolated model definition files'
    ]
  },
  {
    full_name: 'pandas-dev/pandas',
    owner: 'pandas-dev',
    name: 'pandas',
    description: 'Flexible and powerful data analysis / manipulation library for Python.',
    language: 'Python',
    stars: 42100,
    forks: 17200,
    open_issues: 3100,
    license: 'BSD-3-Clause',
    html_url: 'https://github.com/pandas-dev/pandas',
    last_updated: '2026-10-02',
    match_score: 89,
    beginner_issue_count: 35,
    why_matched: [
      '✓ Matches Data Science & Python skills',
      '✓ Extensive docstring example improvement requests',
      '✓ Clear developer contribution guidelines'
    ]
  },
  {
    full_name: 'pallets/flask',
    owner: 'pallets',
    name: 'flask',
    description: 'The Python micro framework for building web applications.',
    language: 'Python',
    stars: 67200,
    forks: 16200,
    open_issues: 45,
    license: 'BSD-3-Clause',
    html_url: 'https://github.com/pallets/flask',
    last_updated: '2026-09-25',
    match_score: 88,
    beginner_issue_count: 8,
    why_matched: [
      '✓ Concise Python codebase ideal for learning framework internals',
      '✓ Clear contribution guidelines and test suite setup',
      '✓ Fits your 2-4 hours available time commitment'
    ]
  },
  {
    full_name: 'pydantic/pydantic',
    owner: 'pydantic',
    name: 'pydantic',
    description: 'Data parsing and validation using Python type hints.',
    language: 'Python',
    stars: 21400,
    forks: 1800,
    open_issues: 190,
    license: 'MIT',
    html_url: 'https://github.com/pydantic/pydantic',
    last_updated: '2026-09-29',
    match_score: 87,
    beginner_issue_count: 12,
    why_matched: [
      '✓ Python core data library used widely across AI frameworks',
      '✓ Excellent documentation and typing test suite'
    ]
  },
  {
    full_name: 'streamlit/streamlit',
    owner: 'streamlit',
    name: 'streamlit',
    description: 'Streamlit — The fastest way to build and share data apps in Python.',
    language: 'Python',
    stars: 33500,
    forks: 2700,
    open_issues: 410,
    license: 'Apache-2.0',
    html_url: 'https://github.com/streamlit/streamlit',
    last_updated: '2026-09-27',
    match_score: 86,
    beginner_issue_count: 16,
    why_matched: [
      '✓ Beginner friendly data visualization and web app tool',
      '✓ Dedicated community helper channel on Discord'
    ]
  },
  {
    full_name: 'psf/requests',
    owner: 'psf',
    name: 'requests',
    description: 'A simple, yet elegant, HTTP library for Python, built for human beings.',
    language: 'Python',
    stars: 51200,
    forks: 9100,
    open_issues: 30,
    license: 'Apache-2.0',
    html_url: 'https://github.com/psf/requests',
    last_updated: '2026-09-20',
    match_score: 85,
    beginner_issue_count: 5,
    why_matched: [
      '✓ Clean Python syntax with minimal external dependencies',
      '✓ High quality documentation and clear issue triage'
    ]
  },
  {
    full_name: 'tiangolo/sqlmodel',
    owner: 'tiangolo',
    name: 'sqlmodel',
    description: 'SQL databases in Python, designed for simplicity, compatibility, and robustness.',
    language: 'Python',
    stars: 13200,
    forks: 750,
    open_issues: 85,
    license: 'MIT',
    html_url: 'https://github.com/tiangolo/sqlmodel',
    last_updated: '2026-09-26',
    match_score: 84,
    beginner_issue_count: 9,
    why_matched: [
      '✓ Small, modern Python library combining SQLAlchemy and Pydantic',
      '✓ Great opportunity for first-time SQL library contributors'
    ]
  },
  {
    full_name: 'django/django',
    owner: 'django',
    name: 'django',
    description: 'The Web framework for perfectionists with deadlines.',
    language: 'Python',
    stars: 78200,
    forks: 31000,
    open_issues: 180,
    license: 'BSD-3-Clause',
    html_url: 'https://github.com/django/django',
    last_updated: '2026-10-01',
    match_score: 83,
    beginner_issue_count: 25,
    why_matched: [
      '✓ Mature open source ecosystem with structured Trac issue tracker',
      '✓ Comprehensive documentation sprint tasks'
    ]
  },
  {
    full_name: 'celery/celery',
    owner: 'celery',
    name: 'celery',
    description: 'Distributed Task Queue (development branch).',
    language: 'Python',
    stars: 24100,
    forks: 4600,
    open_issues: 520,
    license: 'BSD-3-Clause',
    html_url: 'https://github.com/celery/celery',
    last_updated: '2026-09-24',
    match_score: 82,
    beginner_issue_count: 11,
    why_matched: [
      '✓ Excellent project for learning asynchronous Python task queues',
      '✓ Active developer matrix chat'
    ]
  },
  {
    full_name: 'numpy/numpy',
    owner: 'numpy',
    name: 'numpy',
    description: 'The fundamental package for scientific computing with Python.',
    language: 'Python',
    stars: 27100,
    forks: 9800,
    open_issues: 1400,
    license: 'BSD-3-Clause',
    html_url: 'https://github.com/numpy/numpy',
    default_branch: 'main',
    last_updated: '2026-09-30',
    match_score: 81,
    beginner_issue_count: 30,
    why_matched: [
      '✓ Core numerical library underlying Python AI & ML',
      '✓ Documentation typo and docstring formula improvements'
    ]
  },
  {
    full_name: 'facebookresearch/hydra',
    owner: 'facebookresearch',
    name: 'hydra',
    description: 'Hydra is a framework for elegantly configuring complex applications.',
    language: 'Python',
    stars: 8900,
    forks: 650,
    open_issues: 110,
    license: 'MIT',
    html_url: 'https://github.com/facebookresearch/hydra',
    default_branch: 'main',
    last_updated: '2026-09-28',
    match_score: 80,
    beginner_issue_count: 9,
    why_matched: [
      '✓ Widely used in Python ML research workflows',
      '✓ Modular plugin architecture ideal for small feature additions'
    ]
  },
  {
    full_name: 'vllm-project/vllm',
    owner: 'vllm-project',
    name: 'vllm',
    description: 'A high-throughput and memory-efficient LLM serving and inference engine',
    language: 'Python',
    stars: 31000,
    forks: 5200,
    open_issues: 820,
    license: 'Apache-2.0',
    html_url: 'https://github.com/vllm-project/vllm',
    default_branch: 'main',
    last_updated: '2026-10-03',
    match_score: 79,
    beginner_issue_count: 15,
    why_matched: [
      '✓ Top tier AI infrastructure project matching your domain interests',
      '✓ Active community triage with dedicated beginner issue labels'
    ]
  },
  {
    full_name: 'ollama/ollama',
    owner: 'ollama',
    name: 'ollama',
    description: 'Get up and running with Llama 3.2, Mistral, Gemma 2, and other large language models.',
    language: 'Go',
    stars: 98000,
    forks: 8100,
    open_issues: 450,
    license: 'MIT',
    html_url: 'https://github.com/ollama/ollama',
    default_branch: 'main',
    last_updated: '2026-10-03',
    match_score: 78,
    beginner_issue_count: 12,
    why_matched: [
      '✓ Leading open-source local LLM runner',
      '✓ Excellent documentation and CLI helper contribution tasks'
    ]
  }
];

export const DEMO_ISSUES_MAP: Record<string, IssueItem[]> = {
  'fastapi/fastapi': [
    {
      number: 142,
      title: 'Improve error message clarity in request body validation',
      body: 'When a required Pydantic field is missing from JSON body, the current exception detail is missing the field path in nested models. Adding full field path improves developer debugging experience.',
      labels: ['good first issue', 'enhancement', 'documentation'],
      comments_count: 4,
      html_url: 'https://github.com/fastapi/fastapi/issues/142',
      difficulty: 'Beginner',
      match_score: 94,
      estimated_time: '2-4 hours',
      required_skills: ['Python', 'Error Handling', 'Pytest'],
      why_suitable: [
        '✓ Small isolated scope in exception handler',
        '✓ Existing test cases in tests/test_validation.py',
        '✓ High utility for FastAPI developers'
      ]
    },
    {
      number: 215,
      title: 'Fix typo in OpenAPI security tutorial documentation',
      body: 'In docs/en/docs/tutorial/security/first-steps.md line 45, authentification should be spelled authentication.',
      labels: ['good first issue', 'documentation'],
      comments_count: 2,
      html_url: 'https://github.com/fastapi/fastapi/issues/215',
      difficulty: 'Beginner',
      match_score: 98,
      estimated_time: '1-2 hours',
      required_skills: ['Markdown', 'Documentation'],
      why_suitable: [
        '✓ Pure documentation typo fix',
        '✓ Ideal very first open-source PR'
      ]
    }
  ],
  'scikit-learn/scikit-learn': [
    {
      number: 304,
      title: 'Add docstring example for StandardScaler with sparse matrices',
      body: 'The StandardScaler documentation describes handling sparse matrices with with_mean=False, but lacks a minimal runnable code example in the docstring.',
      labels: ['easy', 'documentation'],
      comments_count: 3,
      html_url: 'https://github.com/scikit-learn/scikit-learn/issues/304',
      difficulty: 'Beginner',
      match_score: 93,
      estimated_time: '2-4 hours',
      required_skills: ['Python', 'NumPy', 'Docstrings'],
      why_suitable: [
        '✓ Matches Python and ML interest',
        '✓ Well defined scope in sklearn/preprocessing/_data.py'
      ]
    }
  ]
};

export const DEMO_ANALYSIS: Record<string, RepoAnalysis> = {
  'fastapi/fastapi': {
    full_name: 'fastapi/fastapi',
    description: 'FastAPI framework, high performance, easy to learn, fast to code, ready for production',
    what_it_does: 'FastAPI is a modern, fast (high-performance), web framework for building APIs with Python based on standard Python type hints.',
    why_suitable: 'Extremely clean architecture with explicit Pydantic data schemas, extensive documentation, and an active maintainer review cycle.',
    getting_started_difficulty: 'Beginner',
    tech_stack: ['Python', 'Pydantic', 'Starlette', 'Pytest', 'Uvicorn'],
    project_structure: 'fastapi/ (core app & routing), tests/ (comprehensive pytest suite), docs/ (multilingual documentation).',
    evidence_indicators: {
      readme: '✓ Verified from GitHub README.md',
      metadata: '✓ Verified from repository metadata',
      ai: '✓ AI structural analysis'
    }
  }
};

export const DEMO_PLAN: ContributionPlan = {
  repo_full_name: 'fastapi/fastapi',
  issue_number: 142,
  issue_title: 'Improve error message clarity in request body validation',
  difficulty: 'Beginner',
  estimated_time: '2-4 hours',
  required_skills: ['Python', 'Error Handling', 'Pytest'],
  files_involved: [
    {
      file_path: 'fastapi/exceptions.py',
      status: 'VERIFIED',
      reason: '✓ VERIFIED: Contains RequestValidationError logic'
    },
    {
      file_path: 'tests/test_validation.py',
      status: 'VERIFIED',
      reason: '✓ VERIFIED: Contains pytest assertions for exception responses'
    },
    {
      file_path: 'README.md',
      status: 'VERIFIED',
      reason: '✓ VERIFIED: Contains contribution setup guide'
    }
  ],
  what_to_understand: [
    'Understand how FastAPI catches RequestValidationError during body parsing',
    'Trace how Pydantic error list is transformed into JSON detail output',
    'Review existing exception test cases in test_validation.py'
  ],
  step_by_step_plan: [
    '1. Fork repository on GitHub and clone your fork locally: git clone https://github.com/YOUR_USERNAME/fastapi.git',
    '2. Create feature branch: git checkout -b fix/validation-error-clarity',
    '3. Open fastapi/exceptions.py and inspect RequestValidationError handler',
    '4. Modify error formatter to include complete nested model field path',
    '5. Add new test case to tests/test_validation.py verifying nested field path',
    '6. Run pytest locally to confirm fix passes: pytest tests/test_validation.py',
    '7. Verify code style and formatting: ruff check .',
    '8. Commit changes: git commit -m "fix: include nested field path in validation error detail"',
    '9. Push branch and open Pull Request on GitHub'
  ],
  testing_plan: [
    'Run unit test suite: pytest tests/test_validation.py',
    'Test edge cases with deeply nested JSON models',
    'Ensure existing validation status codes (422 Unprocessable Entity) remain unchanged'
  ],
  git_workflow: [
    'git clone https://github.com/YOUR_USERNAME/fastapi.git',
    'cd fastapi',
    'git checkout -b fix/validation-error-clarity',
    'git add fastapi/exceptions.py tests/test_validation.py',
    'git commit -m "fix: include nested field path in validation error detail"',
    'git push origin fix/validation-error-clarity'
  ]
};
