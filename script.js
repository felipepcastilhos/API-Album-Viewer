let currentStart = 1
let isLoading = false
const apiKey = '8175fA5f6098c5301022f475da32a2aa'
let token = ''
const maxRecords = 105
const URL_BASE = 'https://ucsdiscosapi.azurewebsites.net/Discos'

// evento para carregar imagens ao carregar a página
document.addEventListener('DOMContentLoaded', async () => {
  await authenticate()
  if (token) {
    loadImages(currentStart, 12)
  } else {
    alert('Erro ao obter o token')
  }
})

// evento para carregar mais imagens ao rolar a página
window.addEventListener('scroll', () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 20 &&
    !isLoading
  ) {
    loadImages(currentStart, 4)
  }
})

// Função para autenticar e obter o token
async function authenticate() {
  try {
    const response = await fetch(`${URL_BASE}/autenticar`, {
      method: 'POST',
      headers: {
        accept: '*/*',
        ChaveApi: apiKey
      }
    })

    if (!response.ok) {
      throw new Error('Erro na autenticação')
    }

    const result = await response.text()
    token = result.trim()
    console.log('Token:', token)
  } catch (error) {
    console.error('Erro na autenticação: ', error)
    alert('Erro na autenticação')
  }
}

// função para carregar imagens
async function loadImages(start, quantity) {
  if (isLoading || !token) return
  isLoading = true
  document.getElementById('loading').style.display = 'block'

  if (start >= maxRecords) {
    console.log('Reinicia ID')
    currentStart = 1
    start = currentStart
  }
  if (start == 101) {
    quantity = 5
  }

  try {
    const response = await fetch(
      `${URL_BASE}/records?numeroInicio=${start}&quantidade=${quantity}`, // URL para carregar imagens com query string
      {
        method: 'GET',
        headers: {
          accept: '*/*',
          TokenApiUCS: token
        }
      }
    )

    if (!response.ok) {
      const errorMessage = await response.text()
      console.error('Erro ao carregar imagens:', errorMessage)
      throw new Error('Erro ao carregar imagens')
    }

    const records = await response.json()

    const imageGrid = document.getElementById('image-grid')

    records.forEach(record => {
      if (record.imagemEmBase64) {
        const col = document.createElement('div')
        col.className = 'col'

        const img = document.createElement('img')
        img.src = `data:image/png;base64,${record.imagemEmBase64}`
        img.alt = record.descricaoPrimaria || 'Capa do álbum'
        img.className = 'album-cover'
        img.dataset.id = record.id
        img.addEventListener('click', () => showDetails(img.dataset.id))

        col.appendChild(img)
        imageGrid.appendChild(col)
      } else {
        console.warn('Registro sem imagem:', record)
      }
    })

    currentStart += records.length
  } catch (error) {
    console.error('Erro ao carregar imagens:', error)
    alert('Erro ao carregar imagens')
  } finally {
    isLoading = false
    document.getElementById('loading').style.display = 'none'
  }
}

// função para mostrar detalhes de cada álbum
async function showDetails(id) {
  try {
    document.getElementById('loading').style.display = 'block'
    const response = await fetch(`${URL_BASE}/record?numero=${id}`, {
      method: 'GET',
      headers: {
        accept: '*/*',
        TokenApiUCS: token
      }
    })

    if (!response.ok) {
      throw new Error('Erro ao carregar detalhes')
    }

    const details = await response.json()

    if (details.imagemEmBase64) {
      document.getElementById(
        'modal-image'
      ).src = `data:image/png;base64,${details.imagemEmBase64}`
    } else {
      document.getElementById('modal-image').src =
        'https://via.placeholder.com/150?text=Sem+Imagem'
    }

    document.getElementById('modal-details').innerText = `
      ID: ${details.id || 'Não disponível'}\n
      Descrição Primária: ${details.descricaoPrimaria || 'Não disponível'}\n
      Descrição Secundária: ${details.descricaoSecundaria || 'Não disponível'}
    `

    const modal = new bootstrap.Modal(document.getElementById('detailModal'))
    modal.show()
  } catch (error) {
    console.error('Erro ao carregar detalhes do álbum:', error)
    alert('Erro ao carregar detalhes do álbum. Tente novamente.')
  } finally {
    document.getElementById('loading').style.display = 'none'
  }
}
