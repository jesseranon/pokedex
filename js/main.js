/**********************************
 * NOTES
 * 
 * pokedex.pokemon_entries
 * {
 * entry_number
 * pokemon_species {name, url}
 * }
 * 
 * pokemon_species.url -> returns err:
 * unexpected token N in JSON at position 0
 * 
 * random sprites appear on the screen.
 * user clicks on sprite to get info into pokedex
**********************************/

document.addEventListener('DOMContentLoaded', appInit);

async function appInit() {
  const app = new App();
  app.init();
  // console.log(app);
  let species = await app.getPokemonInfo('pikachu');
  // console.log(species);
}

class App {
  constructor() {
    this.baseUrl = 'https://pokeapi.co/api/v2';
    this.speciesUrlMode = 'pokemon-species';
    this.pokemonUrlMode = 'pokemon';
    this.numberOfPokemon = 0;
    this.pokemon = [];
    this.searchBtn = document.querySelector('#search-btn');
    this.pokedex = {
      number: document.querySelector('.pokemon-info .number'),
      name: document.querySelector('.pokemon-info .name'),
      genus: document.querySelector('.pokemon-info .genus'),
      height: document.querySelector('.pokemon-info .height'),
      weight: document.querySelector('.pokemon-info .weight'),
      sprite: document.querySelector('.pokemon-img .sprite'),
      types: document.querySelector('.pokemon-info .types'),
      flavorText: document.querySelector('.pokedex .flavor-text p'),
      evolutions: document.querySelector('.evolutions'),
    }
    this.history = {};
  }

  /**
   * THIS IS WHERE THE BUTTON CLICK LISTENER LIVES
   * * THIS IS WHERE THE BUTTON CLICK LISTENER LIVES
   * * THIS IS WHERE THE BUTTON CLICK LISTENER LIVES
   * * THIS IS WHERE THE BUTTON CLICK LISTENER LIVES
   * * THIS IS WHERE THE BUTTON CLICK LISTENER LIVES
   * **/
  async init() {
    const data = await this.getFetch();
    if (this.pokemon.length === 0) this.pokemon = this.pokemon.concat(data.pokemon_entries.map(p => p.pokemon_species.name));
    if (this.numberOfPokemon === 0) this.numberOfPokemon = data.pokemon_entries.length;
    let defaultPokemon = 'pikachu';
    let defaultData = await this.getPokemonInfo(defaultPokemon);
    this.renderPokedex(defaultData);
    this.searchBtn.addEventListener('click', async e => {
        e.preventDefault();
        let pokemonName = document.querySelector('input').value.toLowerCase();
        if (this.pokemon.includes(pokemonName)) {
          let pokemonInfo = await this.getPokemonInfo(pokemonName);
          this.renderPokedex(pokemonInfo);
        } else {
          alert(`That's not a pokemon!`);
        }
      })
  }

  async getFetch(url = `${this.baseUrl}/pokedex/1`) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data;
    } catch (error) {
      console.log(error);
      alert(`Please type in a pokemon name!`);
    }
  }

  /**
   * gets pokemon and pokemon species info,
   * returns a single object
   * **/
  async getPokemonInfo(str) {
    let pokemonObj = await this.getPokemon(`${this.baseUrl}/${this.pokemonUrlMode}/${str}`);
    let speciesObj = await this.getPokemonSpecies(`${this.baseUrl}/${this.speciesUrlMode}/${str}`);
    return Object.assign(pokemonObj, speciesObj);
  }

  /** 
   * Returns height, weight, sprite, and types
   * **/
  async getPokemon(url) {
    const pokemon = await this.getFetch(url);
    let weight = this.getPokemonWeight(pokemon.weight);
    let height = this.getPokemonHeight(pokemon.height);
    const sprite = pokemon.sprites.front_default;
    const types = pokemon.types.map(t => t.type.name);
    return {
      'weight': weight,
      'height': height,
      'sprite': sprite,
      'types': types
    }
  }

  getPokemonHeight(num) { //convert decimeters to feet/inches
    let heightDm = num;
    let heightIn = heightDm / 0.254;
    let heightFt = Math.floor(heightIn / 12);
    heightIn = Math.round(heightIn - (heightFt * 12)).toString().padStart(2, '0');
    return `${heightFt}'${heightIn}"`;
  }

  getPokemonWeight(num) { // convert hectograms to pounds
    let weightHg = num;
    let weightLb = 0.22046226 * weightHg;
    return `${weightLb.toFixed(1)} lbs.`;
  }

  /** 
   * Returns name, genus, flavor text, and evolution chain
   * **/
  async getPokemonSpecies(url) {
    const species = await this.getFetch(url);
    const number = species.id;
    const name = this.getPokemonSpeciesName(species.names);
    const genus = this.getPokemonSpeciesGenus(species.genera);
    const flavorText = this.getPokemonSpeciesFlavorText(species.flavor_text_entries);
    const evolutionChain = await this.getEvolutionChain(species.evolution_chain.url);
    return {
      'number': number,
      'name': name,
      'genus': genus,
      'flavorText': flavorText,
      'evolutionChain': evolutionChain
    };
  }

  getPokemonSpeciesName(arr) {
    let pokemonNamesEn = arr.filter(n => n.language.name === 'en');
    return pokemonNamesEn[0].name;
  }

  getPokemonSpeciesGenus(arr) {
    const generaEn = arr.filter(g => {
      if (g.language.name === 'en') return g.genus;
    });
    const genus = generaEn[0].genus;
    return genus;
  }

  getPokemonSpeciesFlavorText(arr) {
    const flavorTextEn = arr.filter(f =>  {
      if (f.language.name === 'en') return f.flavor_text;
    });
    const flavorText = flavorTextEn[this.rollRandom(flavorTextEn.length)].flavor_text;
    return flavorText;
  }

  async getEvolutionChain(url) {
    const evolutionChainObj = await this.getFetch(url);
    const res = {};
    const start = evolutionChainObj.chain;

    let evolutions = getEvolutions(start);

    for (const e of evolutions) {
      res[e] = await this.getSprite(e);
    }
    
    return res;

    function getEvolutions(obj) {
      let res = [];
      res = res.concat(obj.species.name);
      let evolutions = obj.evolves_to;
      if (evolutions.length > 0) {
        evolutions.forEach(e => {
          res = res.concat(getEvolutions(e));
        });
      }
      return res;
    }
  }

  async getSprite(str) {
    let pokemon = await this.getFetch(`${this.baseUrl}/${this.pokemonUrlMode}/${str}`);
    return pokemon.sprites.front_default;
  }

  /** 
   * For setting the pokedex card
   * **/

  async renderPokedex(obj) {
    // console.log(`from setPokedex`, obj.evolutionChain);
    const name = obj.name;
    const number = obj.number;
    const height = obj.height;
    const weight = obj.weight;
    const flavorText = obj.flavorText;
    const sprite = obj.sprite;
    const types = obj.types;
    const genus = obj.genus;
    const evolutionChain = obj.evolutionChain;
    this.pokedex.name.textContent = name;
    this.pokedex.number.textContent = number;
    this.pokedex.height.textContent = height;
    this.pokedex.weight.textContent = weight;
    this.pokedex.flavorText.textContent = flavorText;
    this.pokedex.genus.textContent = genus;

    this.pokedex.sprite.src = sprite;
    this.pokedex.sprite.alt = name;    

    // evolutions
    this.renderTypes(types);
    await this.renderEvolutions(evolutionChain);

  }

  renderTypes(arr) {
    let types = arr;
    this.pokedex.types.textContent = '';
    types.forEach(type => {
      const listItem = document.createElement('li');
      listItem.classList.add(type);
      let span = document.createElement('span');
      span.classList.add('type');
      span.textContent = type;
      listItem.appendChild(span);
      this.pokedex.types.appendChild(listItem);
    });
  }

  async renderEvolutions(obj) {
    let evolutionChain = obj;
    const evolutions = Object.keys(evolutionChain);
    this.pokedex.evolutions.textContent = '';

    if (evolutions.length > 1) {

      let evolutionTree = document.createElement('ul');
      evolutionTree.classList.add('evolution-tree');

      for (const evolution of evolutions) {
          let listItem = document.createElement('li');
          let anchor = document.createElement('a');
          anchor.setAttribute('href', '#pokedex');
          let img = document.createElement('img');
          img.src = evolutionChain[evolution];
          img.alt = evolution;
          anchor.appendChild(img);
          listItem.appendChild(anchor);
          evolutionTree.classList.add('horizontal');
          evolutionTree.appendChild(listItem);
          // console.log(evolution);
          // console.log(evolutionChain[evolution]);
        }

      this.pokedex.evolutions.appendChild(evolutionTree);

      let evolutionTreeLinks = Array.from(document.querySelectorAll('.evolution-tree li a'));
      for (const link of evolutionTreeLinks) {
        link.addEventListener('click', async e => {
          let pokemonName = e.currentTarget.childNodes[0].alt;
          if (this.pokemon.includes(pokemonName)) {
            let pokemonInfo = await this.getPokemonInfo(pokemonName);
            this.renderPokedex(pokemonInfo);
          } else {
            alert(`That's not a pokemon!`);
          }
        });
      }

    } else {
        const newElement = document.createElement('span');
        newElement.classList.add('centered');
        newElement.textContent = 'No evolutions known for this Pokémon';
        this.pokedex.evolutions.appendChild(newElement);
    }
  }
  /** 
   * helper function
   * **/
  rollRandom(num) {
    return Math.floor(Math.random() * num);
  }

}