
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


function Dropdown({ show, suggestion } : { show: boolean, suggestion: Suggestion | undefined }) {
  return <>
    {(
    show && suggestion ? (
      suggestion.suggestions.map((suggestion) => {
        return (
          <div className="dropdown">
            <div className="element">
              {suggestion}
            </div>
          </div>
        )
      })
    ) : null
  )}
  </>
}


function SearchBar({ handleSearch }: { handleSearch: any }) {

  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | undefined>(undefined);

  function handleSuggestions(searchTerm: string) {
    if (searchTerm !== "") {
      GetSuggestions(searchTerm)
      .then(resp => {
        setSuggestion(resp);
      });
      setShowDropdown(true);
    }
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
      <Dropdown show={showDropdown} suggestion={suggestion}/>
    </div>
  )
}

function SearchResults({ searchTerm } : { searchTerm: string }) {
  const [queryResult, setQueryResults] = useState<QueryResult | undefined>(undefined);

  function Pagination({queryResult} : {queryResult: QueryResult | undefined}) {
    if (queryResult) {
      let start: number;
      if (queryResult.Page === 1) {
        start = 1;
      } else {
        start = (queryResult.Page-1) * queryResult.PageSize;
      }
      const end = queryResult.Page * queryResult.PageSize;
      const total = queryResult.TotalNumberOfResults
      return (
        <div className="pagination">
          <span>Showing {start}-{end} of {total} results</span>
        </div>
      )
    }
    return null;
  }

  function BoldedText({excerpt} : {excerpt: DocumentText}) {
    // sort highlights by BeginOffset
    excerpt.Highlights.sort((a, b) => {
      if (a.BeginOffset < b.BeginOffset) {
        return -1;
      } else {
        return 1;
      }
    });

    const highlights = excerpt.Highlights;
    const text = excerpt.Text;
    let currIndex: number = 0;

    return (
      <>{highlights.map((highlight, index) => {
        if (index !== highlights.length - 1) {
          const el = (
            <>
              <span>{text.slice(currIndex, highlight.BeginOffset)}</span>
              <span style={{fontWeight: 700}}>
                {text.slice(highlight.BeginOffset, highlight.EndOffset)}
              </span>
            </>
          );
          currIndex = highlight.EndOffset;
          return el;
        }
        else {
          const el = (
            <>
              <span>{text.slice(currIndex, highlight.BeginOffset)}</span>
              <span style={{fontWeight: 700}}>
                {text.slice(highlight.BeginOffset, highlight.EndOffset)}
              </span>
              <span>{text.slice(highlight.EndOffset, text.length)}</span>
            </>
          )
          return el;
        }
      })
     }</>
    );
  }

  function SearchResult({result} : {result: Result}) {
    return (
      <div className="search-result">
        <div className="search-result-title">
          <span>{result.DocumentTitle.Text}</span>
        </div>
        <div className="search-result-excerpt">
          <BoldedText excerpt={result.DocumentExcerpt} />
        </div>
        <div className="search-result-uri">
          <a href={result.DocumentURI}>{result.DocumentURI}</a>
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (searchTerm !== "") {
      GetSearchResult(searchTerm)
      .then(resp => {
        setQueryResults(resp);
      });
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