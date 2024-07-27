
import { useEffect, useState } from "react";
import { MdClear, MdSearch } from "react-icons/md";


interface Suggestion {
  stemmedQueryTerm: string;
  suggestions: string[];
}

interface Highlight {
  BeginOffset: number;
  EndOffset: number;
}

interface DocumentText {
  Highlights: Highlight[];
  Text: string;
}

interface Result {
  Id: string | null;
  DocumentId: string;
  DocumentExcerpt: DocumentText;
  DocumentTitle: DocumentText;
  DocumentURI: string;
}

interface QueryResult {
  Page: number;
  PageSize: number;
  ResultItems: Result[];
  TotalNumberOfResults: number
}

function GetSuggestions(queryString: string): Promise<Suggestion> {
  const url = "https://gist.githubusercontent.com/yuhong90/b5544baebde4bfe9fe2d12e8e5502cbf/raw/e026dab444155edf2f52122aefbb80347c68de86/suggestion.json";
  return fetch(url)
    .then(response => response.json());
}

function GetSearchResult(searchTerm: string): Promise<QueryResult> {
  const url = "https://gist.githubusercontent.com/yuhong90/b5544baebde4bfe9fe2d12e8e5502cbf/raw/44deafab00fc808ed7fa0e59a8bc959d255b9785/queryResult.json";
  return fetch(url)
    .then(response => response.json());
}


function Dropdown({show } : { show: boolean }) {
  const dropdownEl = (show ? (
    <div className="dropdown">
      <div className="element">
        dropdown item #1
      </div>
      <div className="element">
        dropdown item #2
      </div>
      <div className="element">
        dropdown item #3
      </div>
      <div className="element">
        dropdown item #4
      </div>
    </div>
  ) : null )
  return dropdownEl;
}


function SearchBar({ handleSearch }: { handleSearch: any }) {

  const [showDropdown, setShowDropdown] = useState(false);

  function handleSuggestions(searchTerm: string) {
    setShowDropdown(true);
  }

  function handleClick(action: string) {
    const inputEl = document.querySelector('input');
    if (action === 'clear') {
      if (inputEl) {
        inputEl.value = "";
        setShowDropdown(false);
      }
      handleSearch("");
    }
    else if (action === "search") {
      if (inputEl) {
        handleSearch(inputEl.value);
        setShowDropdown(false);
      }
    }
  }

  return (
    <div className="search-bar-background">
      <div className="search-bar">
        <input
          type="text"
          className={showDropdown ? "dropdown-shown" : ""}
          onChange={(e) => handleSuggestions(e.target.value)}
        />
        <button className="clear" onClick={() => handleClick('clear')}>
          <MdClear />
        </button>
        <button className="search" onClick={() => handleClick('search')}>
          <span className="label">
            <MdSearch/> <span>Search</span>
          </span>
        </button>
      </div>
      <Dropdown show={showDropdown} />
    </div>
  )
}

function SearchResults({ searchTerm } : { searchTerm: string }) {
  const [queryResult, setQueryResults] = useState<QueryResult | undefined>(undefined);

  function Pagination({queryResult} : {queryResult: QueryResult | undefined}) {
    if (queryResult) {
      const start = queryResult.Page * queryResult.PageSize;
      const end = start + queryResult.PageSize;
      const total = queryResult.TotalNumberOfResults
      return (
        <div className="pagination">
          <span>Showing {start}-{end} of {total} results</span>
        </div>
      )
    }
    return null;
  }

  function SearchResult({result} : {result: Result}) {
    return (
      <div className="search-result">
        <div className="search-result-title">
          <span>{result.DocumentTitle.Text}</span>
        </div>
        <div className="search-result-excerpt">
          <span>{result.DocumentExcerpt.Text}</span>
        </div>
        <div className="search-result-uri">
          <a href={result.DocumentURI}>{result.DocumentURI}</a>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (searchTerm !== "") {
      // setDescription(`Searching for: ${searchTerm}`);
      GetSearchResult(searchTerm)
      .then(resp => {
        setQueryResults(resp);
        // setDescription(queryResult.TotalNumberOfResults.toString());
        // return queryResult.ResultItems
      })
      // .then(resultItems => {
      //   setResults(resultItems);
      // });
      return () => {};
    }
  }, [searchTerm]);

  return (
    <div className="search-results">
      <Pagination queryResult={queryResult} />
      {queryResult?.ResultItems.map((result) => {
        return <SearchResult key={result.DocumentId} result={result} />
      })}
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