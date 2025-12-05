const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const profileContainer = document.getElementById('profile-container');

const API_URL = 'https://api.github.com/users/';

// COLE SEU TOKEN AQUI ↓↓
const TOKEN = "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"; 

function sanitizeUsername(raw) {
    if (!raw) return '';
    let s = raw.trim();

    s = s.replace(/^@+/, '');
    s = s.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
    s = s.split('/')[0];

    return s;
}

async function getUser(usernameRaw) {
    const username = sanitizeUsername(usernameRaw);
    if (!username) {
        createErrorCard('Por favor, digite um usuário válido.');
        return;
    }

    const url = API_URL + encodeURIComponent(username);

    try {
        const response = await fetch(url, {
            headers: {
                "Authorization": `token ${TOKEN}`
            }
        });

        let json = null;
        try {
            json = await response.json();
        } catch (e) {}

        if (response.ok) {
            createProfileCard(json);
            return;
        }

        if (response.status === 404) {
            createErrorCard('Usuário não encontrado (404). Verifique o nome.');
            return;
        }

        if (response.status === 403) {
            const remaining = response.headers.get('x-ratelimit-remaining');
            const reset = response.headers.get('x-ratelimit-reset');

            let msg = 'Acesso negado (403). Limite da API excedido.';

            if (remaining !== null) msg += ` Limite restante: ${remaining}.`;
            if (reset) {
                const resetDate = new Date(Number(reset) * 1000);
                msg += ` Reset em: ${resetDate.toLocaleString()}.`;
            }
            if (json && json.message) msg += ` Mensagem: ${json.message}`;

            createErrorCard(msg);
            return;
        }

        const serverMsg = (json && json.message) ? ` Mensagem: ${json.message}` : '';
        createErrorCard(`Erro na requisição (status ${response.status}).${serverMsg}`);

    } catch (error) {
        createErrorCard('Erro de rede ou exceção. Verifique sua conexão e se está usando Live Server (localhost).');
    }
}

function createProfileCard(user) {
    const { avatar_url, name, login, bio, public_repos, followers, following, html_url } = user;

    const cardHTML = `
    <div class="profile-card">
        <img src="${avatar_url}" alt="Avatar de ${name || login}" class="profile-avatar">
        
        <div class="profile-info">
            <h2>${name || login}</h2>
            <a href="${html_url}" target="_blank">@${login}</a>
            <p>${bio || 'Este usuário não possui bio.'}</p>

            <div class="profile-stats">
                <div class="stat"><span>${public_repos}</span> Repositórios</div>
                <div class="stat"><span>${followers}</span> Seguidores</div>
                <div class="stat"><span>${following}</span> Seguindo</div>
            </div>
        </div>
    </div>
    `;
    profileContainer.innerHTML = cardHTML;
    profileContainer.style.display = 'block';
}

function createErrorCard(message) {
    const cardHTML = `
    <div class="error-card">
        <h3>Oops!</h3>
        <p>${message}</p>
    </div>
    `;
    profileContainer.innerHTML = cardHTML;
    profileContainer.style.display = 'block';
}

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const userToSearch = searchInput.value;
    getUser(userToSearch);
    searchInput.value = '';
});