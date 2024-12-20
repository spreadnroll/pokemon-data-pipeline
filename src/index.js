const { fetchPokemonData } = require('./fetchPoke.js');
const initializeDb = require('./db.js');

async function fetchAllPokemons() {
  const db = await initializeDb();  

  const pokemonsData = [];
  //Set() to avoid duplicates
  const seenPokemon = new Set();

  for (let id = 1; id <= 151; id++) {
    const pokemon = await fetchPokemonData(id);

    if (!seenPokemon.has(pokemon.name)) {
      seenPokemon.add(pokemon.name);

      //running database and populating it with data starting to pokemon table
      db.run(
        `INSERT INTO pokemon (name, weight, height, base_experience) VALUES (?, ?, ?, ?)`,
        [pokemon.name, pokemon.weight, pokemon.height, pokemon.baseExperience],
        function (err) {
          if (err) {
            console.error('Error while inserting a Pokemon', err.message);
          } else {
            const pokemonId = this.lastID;  

            //iterating and inserting types
            pokemon.types.forEach((type) => {
              db.run(
                `INSERT OR IGNORE INTO types (type_name) VALUES (?)`,  
                [type.typeName],
                function (err) {
                  if (err) {
                    console.error('Error while inserting a type:', err.message);
                  } else {
                    const typeId = this.lastID;
                    db.run(
                      `INSERT OR IGNORE INTO pokemon_types (pokemon_id, type_id) VALUES (?, ?)`, 
                      [pokemonId, typeId],
                      function (err) {
                        if (err) {
                          console.error('Error while inserting type relation', err.message);
                        }
                      }
                    );
                  }
                }
              );
            });

            //iterating and inserting abilities
            pokemon.abilitiesAndDescription.forEach((ability) => {
              db.run(
                `INSERT OR IGNORE INTO abilities (ability_name, ability_description) VALUES (?, ?)`,
                [ability.abilityName, ability.abilityDescription],
                function (err) {
                  if (err) {
                    console.error('Error while inserting ability', err.message);
                  } else {
                    const abilityId = this.lastID;
                    db.run(
                      `INSERT OR IGNORE INTO pokemon_abilities (pokemon_id, ability_id) VALUES (?, ?)`, 
                      [pokemonId, abilityId],
                      function (err) {
                        if (err) {
                          console.error('Error while inserting ability relation:', err.message);
                        }
                      }
                    );
                  }
                }
              );
            });
          }
        }
      );

      pokemonsData.push(pokemon);
    } else {
      console.log(`Pokémon ${pokemon.name} già visto, saltato.`);
    }
  }

  console.log(pokemonsData);
}

fetchAllPokemons();
