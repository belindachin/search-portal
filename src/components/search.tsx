
import { useState } from "react";
import { MdClear, MdSearch } from "react-icons/md";


function SearchBar({ handleSearch }: { handleSearch: any }) {

  function handleSuggestions(searchTerm: string) {
    console.log(`suggestions for ${searchTerm} should appear here!`);
  }

  function handleClick(action: string) {
    const inputEl = document.querySelector('input');
    if (action === 'clear') {
      if (inputEl) {
        inputEl.value = "";
      }
      handleSearch("");
    }
    else if (action === "search") {
      if (inputEl) {
        handleSearch(inputEl.value);
      }
    }
  }

  return (
    <div className="search-bar-background">
      <div className="search-bar">
        <input type="text" onChange={(e) => handleSuggestions(e.target.value)}/>
        <button className="clear" onClick={() => handleClick('clear')}>
          <MdClear />
        </button>
        <button className="search" onClick={() => handleClick('search')}>
          <span className="label">
            <MdSearch/> <span>Search</span>
          </span>
        </button>
      </div>
    </div>
  )
}

function SearchResults({ searchTerm } : { searchTerm: string }) {
  let description: string | undefined = undefined;
  if (searchTerm !== "") {
    description = `Searching for: ${searchTerm}`;
  }
  return (
    <div className="search-results">
      {description}
    </div>
  )
}

export default function Search() {
  const [searchTerm, setSearchTerm] = useState('');

  function handleSearch(searchTerm: string): void {
    setSearchTerm(searchTerm);
  }

  return (
    <div className="search">
      <SearchBar handleSearch={handleSearch}/>
      <SearchResults searchTerm={searchTerm} />
    </div>
  )
}