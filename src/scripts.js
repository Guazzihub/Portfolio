const GITHUB_USERNAME = 'Guazzihub';

// Função auxiliar para requisições autenticadas
async function authenticatedFetch(url) {
  try {
    const token = typeof API_TOKEN !== 'undefined' ? API_TOKEN : null;
    
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };

    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok && response.status === 403) {
      console.warn('Rate limit atingido. Considere usar um token de autenticação.');
    }
    
    return response;
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return fetch(url);
  }
}

// Funções de inicialização do carrossel
function initCarousel() {
  const $carousel = $('.projects-carousel');
  const $container = $('.carousel-container');
  
  let currentPosition = 0;
  
  $container.append(`
    <button id="prevBtn" class="carousel-arrow prev" aria-label="Previous">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <button id="nextBtn" class="carousel-arrow next" aria-label="Next">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  `);

  function calculateCardWidth() {
    const containerWidth = $('.carousel-container').width();
    const gap = 24; // espaço entre cards
    
    if (containerWidth >= 1200) {
      return (containerWidth - (2 * gap)) / 3; // 3 cards em telas grandes
    } else if (containerWidth >= 768) {
      return (containerWidth - gap) / 2; // 2 cards em telas médias
    }
    return containerWidth;
  }
  
  function updateCarousel() {
    const $container = $('.carousel-container');
    const $carousel = $('.projects-carousel');
    const $cards = $('.project-card');
    const containerWidth = $container.width();
    const cardWidth = calculateCardWidth();
    const totalWidth = $cards.length * (cardWidth + 24);
    
    $cards.css('width', `${cardWidth}px`);
      
    // Calcula a posição máxima considerando o número exato de cards visíveis
    const visibleWidth = containerWidth - 96;
    const maxPosition = -(totalWidth - visibleWidth);

    // Garante que a posição atual está dentro dos limites
    if (currentPosition < maxPosition) {
      currentPosition = maxPosition;
    }
    if (currentPosition > 0) {
      currentPosition = 0;
    }

    // Atualiza posição do carrossel
    $carousel.css('transform', `translateX(${currentPosition}px)`);
    
    // Atualiza estado dos botões
    $('#prevBtn').prop('disabled', currentPosition >= 0);
    $('#nextBtn').prop('disabled', currentPosition <= maxPosition);
  }

  $('#prevBtn').on('click', () => {
    const cardWidth = calculateCardWidth();
    currentPosition += cardWidth + 24;
    updateCarousel();
  });

  $('#nextBtn').on('click', () => {
    const cardWidth = calculateCardWidth();
    currentPosition -= cardWidth + 24;
    updateCarousel();
  });

  $(window).on('resize', () => {
    currentPosition = 0;
    updateCarousel();
  });

  // Inicializa o carrossel
  updateCarousel();
}

// Funções de integração com GitHub
async function fetchRepoDetails(repoName) {
  try {
    const languagesResponse = await authenticatedFetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/languages`
    );
    const languages = await languagesResponse.ok ? await languagesResponse.json() : {};
    
    let keywords = [];
    const packageJsonResponse = await authenticatedFetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/contents/package.json`
    );
    
    if (packageJsonResponse.ok) {
      const packageData = await packageJsonResponse.json();
      const content = JSON.parse(atob(packageData.content));
      keywords = content.keywords || [];
    } else {
      const projectInfoResponse = await authenticatedFetch(
        `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/contents/project-info.json`
      );
      
      if (projectInfoResponse.ok) {
        const projectData = await projectInfoResponse.json();
        const content = JSON.parse(atob(projectData.content));
        keywords = content.keywords || [];
      }
    }
    
    return {
      languages: Object.keys(languages),
      dependencies: keywords
    };
  } catch (error) {
    console.error(`Error fetching details for ${repoName}:`, error);
    return { languages: [], dependencies: [] };
  }
}

function createTechBadges(languages, dependencies) {
  const allTechs = new Set([...languages, ...dependencies]);
  
  return Array.from(allTechs)
    .map(tech => {
      const category = categorizeTech(tech);
      return `<span class="tech-badge ${category}">${tech}</span>`;
    })
    .join('');
}

function categorizeTech(tech) {
  const categories = {
    frontend: ['Front-end', 'Data Analysis', 'Data Visualization', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'React', 'Vue', 'Angular', 'Next.js', 'Tailwind', 'Tailwind CSS', 'Bootstrap', 'Github Pages', 'Responsive', 'JQuery'],
    backend: ['Full-Stack', 'Axios', 'SQL', 'Back-end', 'Python', 'Java', 'Ruby', 'PHP', 'Node.js', 'Express', 'Django', 'Flask', 'EJS','Dotenv', 'API', 'Github Actions'],
    database: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Mongoose', 'Supabase', 'Firebase'],
    tool: ['Webpack', 'Babel', 'ESLint', 'Prettier', 'Docker', 'Kubernetes','Wordpress', 'Yarn', 'Chocolatey', 'Slack', 'Postman', 'N8N', 'Webhook', 'pip', 'npm', 'Whisper', 'BeautifulSoup', 'Power BI']
  };
   
  for (const [category, techs] of Object.entries(categories)) {
    if (techs.some(t => tech.toLowerCase().includes(t.toLowerCase()))) {
      return category;
    }
  }
  
  return 'other';
}

function createProjectCard(project, details) {
  return `
    <a href="${project.html_url}" target="_blank" class="project-card">
      <div class="project-content">
        <div>
          <h3 class="project-title">${project.name}</h3>
          <p class="project-description">${project.description || 'Sem descrição disponível'}</p>
        </div>
        <div class="tech-badges">
          ${createTechBadges(details.languages, details.dependencies)}
        </div>
      </div>
    </a>
  `;
}

async function fetchGitHubProjects() {
  try {
    const response = await authenticatedFetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch repositories');
    }
    const repos = await response.json();
    return repos.filter(repo => !repo.fork && !repo.archived);
  } catch (error) {
    console.error('Error fetching GitHub projects:', error);
    return [];
  }
}

async function initPortfolio() {
  try {
    const projects = await fetchGitHubProjects();
    
    const carousel = document.getElementById('projectsCarousel');
    if (!projects.length) {
      carousel.innerHTML = '<p class="text-center">Nenhum projeto encontrado.</p>';
      return;
    }
        
    // Fetch detailed information for each project
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const details = await fetchRepoDetails(project.name);
        return { project, details };
      })
    );
    
    const projectsHTML = projectsWithDetails
      .map(({ project, details }) => createProjectCard(project, details))
      .join('');
    
    carousel.innerHTML = projectsHTML;
    
    initCarousel();
  } catch (error) {
    console.error('Erro ao carregar projetos:', error);
    const carousel = document.getElementById('projectsCarousel');
    carousel.innerHTML = '<p class="text-center">Erro ao carregar projetos.</p>';
  }
}

// Inicializa o portfólio quando o documento estiver pronto
$(document).ready(initPortfolio);
