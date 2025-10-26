// GitHub API integration for dynamic project loading
// Approach: Hybrid with manual curation via topics

const GITHUB_USERNAME = 'ghostintheshell-192';
const FEATURED_TOPICS = ['featured', 'portfolio'];

// Manual configuration for projects with custom properties
const PROJECT_CONFIG = {
    'sheet-atlas': {
        homepage: 'https://ghostintheshell-192.github.io/sheet-atlas/',
        featured: true
    },
    'government-feed': {
        featured: true
    }
};

async function loadProjects() {
    const container = document.getElementById('projects-container');

    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated`);

        if (!response.ok) {
            throw new Error('Failed to fetch repositories');
        }

        const repos = await response.json();

        // Filter projects: either has featured topic OR is in manual config
        const featuredProjects = repos.filter(repo => {
            const config = PROJECT_CONFIG[repo.name];
            const hasFeaturedTopic = repo.topics?.some(topic => FEATURED_TOPICS.includes(topic));
            return (config && config.featured) || hasFeaturedTopic;
        });

        if (featuredProjects.length === 0) {
            container.innerHTML = '<p class="no-projects">No featured projects yet.</p>';
            return;
        }

        // Sort: projects with stars first, then by update date
        featuredProjects.sort((a, b) => {
            if (b.stargazers_count !== a.stargazers_count) {
                return b.stargazers_count - a.stargazers_count;
            }
            return new Date(b.updated_at) - new Date(a.updated_at);
        });

        // Generate HTML for each project
        container.innerHTML = featuredProjects.map(repo => {
            const config = PROJECT_CONFIG[repo.name] || {};
            const homepage = config.homepage || repo.homepage;

            return `
                <div class="project">
                    <h3 class="project-name">${formatProjectName(repo.name)}</h3>
                    ${repo.description ? `<p class="project-description">${repo.description}</p>` : ''}
                    <div class="project-meta">
                        ${repo.language ? `<span class="project-language">${repo.language}</span>` : ''}
                        ${repo.stargazers_count > 0 ? `<span class="project-stars">★ ${repo.stargazers_count}</span>` : ''}
                    </div>
                    <div class="project-links">
                        ${homepage ? `<a href="${homepage}" target="_blank" rel="noopener noreferrer">Site</a>` : ''}
                        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">Repository</a>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = '<p class="error">Failed to load projects. Please try again later.</p>';
    }
}

// Format project name: convert kebab-case to Title Case
function formatProjectName(name) {
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Load projects when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProjects);
} else {
    loadProjects();
}
