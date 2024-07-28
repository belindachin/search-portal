
import { useEffect, useState, KeyboardEvent, Dispatch, Fragment } from "react";
import { MdClear, MdSearch } from "react-icons/md";

const nSuggestions: number = 6;

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

function GetSuggestions(queryString: string): Promise<Response> {
  // Assumes that only queryString = 'child' will return suggestions
  const BASE_URL = "https://gist.githubusercontent.com/yuhong90/b5544baebde4bfe9fe2d12e8e5502cbf/raw/";
  let queryId: string;
  if (queryString.toLowerCase() === "child") {
    queryId = "e026dab444155edf2f52122aefbb80347c68de86";
  } else {
    queryId = "noSuggestionsReturned";
  }
  const url = BASE_URL + queryId + "/suggestion.json";
  return fetch(url);
}

function GetSearchResult(searchTerm: string): Promise<Response> {
  // Assumes that only a searchTerm including "child" will return results
  const BASE_URL = "https://gist.githubusercontent.com/yuhong90/b5544baebde4bfe9fe2d12e8e5502cbf/raw/";
  let searchId: string;
  if (searchTerm.toLowerCase().includes("child")) {
    searchId = "44deafab00fc808ed7fa0e59a8bc959d255b9785";
  } else {
    searchId = "noSearchResultsReturned"
  }
  const url = BASE_URL + searchId + "/queryResult.json";
  return fetch(url);
}

function BoldedText({ documentText } : { documentText: DocumentText }) {
  // sort highlights by BeginOffset
  documentText.Highlights.sort((a, b) => {
    if (a.BeginOffset < b.BeginOffset) {
      return -1;
    } else {
      return 1;
    }
  });

  const highlights = documentText.Highlights;
  const text = documentText.Text;
  let currIndex: number = 0;

  return (
    <>{highlights.map((highlight, index) => {
      if (index !== highlights.length - 1) {
        const el = (
          <Fragment key={index}>
            <span>{text.slice(currIndex, highlight.BeginOffset)}</span>
            <span style={{fontWeight: 700}}>
              {text.slice(highlight.BeginOffset, highlight.EndOffset)}
            </span>
          </Fragment>
        );
        currIndex = highlight.EndOffset;
        return el;
      }
      else {
        const el = (
          <Fragment key={index}>
            <span>{text.slice(currIndex, highlight.BeginOffset)}</span>
            <span style={{fontWeight: 700}}>
              {text.slice(highlight.BeginOffset, highlight.EndOffset)}
            </span>
            <span>{text.slice(highlight.EndOffset, text.length)}</span>
          </Fragment>
        )
        return el;
      }
    })
   }</>
  );
}


function Dropdown(
  { show, suggestion, selectedIndex, handleSearch, setShowDropdown }:
  { show: boolean,
    suggestion: Suggestion | undefined,
    selectedIndex: number,
    handleSearch: Function,
    setShowDropdown: Dispatch<React.SetStateAction<boolean>>
  }) {

  function handleSuggestionClick(suggestion: string) {
    handleSearch(suggestion);
    setShowDropdown(false);
    const inputEl = document.querySelector('input');
    if (inputEl) {
      inputEl.value = suggestion;
    }
  }

  const suggestions = suggestion?.suggestions;
  const suggestionsText: DocumentText[] = [];

  if (suggestion && suggestions) {
    const queryTerm = suggestion.stemmedQueryTerm;
    suggestions.map(suggestion => {
      const index = suggestion.indexOf(queryTerm);
      if (index > -1) {
        const suggestionText = {
          Text: suggestion,
          Highlights: [
            {
              BeginOffset: index,
              EndOffset: index + queryTerm.length
            }
          ]
        };
        suggestionsText.push(suggestionText);
      }
      return null;
    });
  }

  return <>
    {(
    show && suggestions ? (
      suggestions.map((suggestion, index) => {
        return (
          <div
            key={index}
            className={index === selectedIndex ? 'dropdown-selected' : 'dropdown'}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            <div className="element">
              <BoldedText documentText={suggestionsText[index]} />
            </div>
          </div>
        )
      })
    ) : null
  )}
  </>
}


function SearchBar({ handleSearch }: { handleSearch: Function }) {

  const [showClear, setShowClear] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | undefined>(undefined);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  function resetInput() {
    setShowClear(false);
    setSelectedIndex(-1);
    handleSearch("");
    setShowDropdown(false);
  }

  function handleSuggestions(searchTerm: string) {
    resetInput();
    if (searchTerm !== "" && searchTerm.length >= 1) {
      setShowClear(true);
    }
    if (searchTerm !== "" && searchTerm.length >= 2) {
      GetSuggestions(searchTerm)
      .then(resp => {
        if (resp?.ok) {
          return resp.json();
        } else {
          throw new Error(`There was an error when getting suggestions for ${searchTerm}`);
        }
      })
      .then(result => {
        result.suggestions = result.suggestions.slice(0, nSuggestions);
        setSuggestion(result);
        setShowDropdown(true);
      })
      .catch(e => {
        console.error(e)
      });
    }
  }

  function handleClick(action: string) {
    const inputEl = document.querySelector('input');
    if (action === 'clear') {
      if (inputEl) {
        inputEl.value = "";
        setShowDropdown(false);
      }
      resetInput();
    }
    else if (action === "search") {
      if (inputEl) {
        handleSearch(inputEl.value);
        setShowDropdown(false);
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    let newSelectedIndex = selectedIndex;
    if (e.key === 'ArrowDown') {
      newSelectedIndex = newSelectedIndex + 1;
      if (newSelectedIndex < nSuggestions) {
        setSelectedIndex(newSelectedIndex);
      }
    }
    if (e.key === 'ArrowUp') {
      newSelectedIndex = newSelectedIndex - 1;
      if (newSelectedIndex >= 0) {
        setSelectedIndex(newSelectedIndex);
      } else {
        setSelectedIndex(-1);
      }
    }
    if (e.key === 'Enter') {
      const inputEl = document.querySelector('input');
      console.log('hit enter', inputEl?.value);
      if (suggestion && selectedIndex >= 0 && selectedIndex < nSuggestions) {
        const newSearchTerm = suggestion.suggestions[selectedIndex];
        if (inputEl) {
          inputEl.value = newSearchTerm;
          setShowDropdown(false);
          handleSearch(newSearchTerm);
        }
      } else {
        setShowDropdown(false);
        handleSearch(inputEl?.value);
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
          onKeyDown={(e) => handleKeyDown(e)}
        />
        <button
          className="clear"
          style={{visibility: showClear ? 'visible' : 'hidden'}}
          onClick={() => handleClick('clear')}
        >
          <MdClear />
        </button>
        <button className="search" onClick={() => handleClick('search')}>
          <span className="label">
            <MdSearch/> <span>Search</span>
          </span>
        </button>
      </div>
      <Dropdown
        show={showDropdown}
        suggestion={suggestion}
        selectedIndex={selectedIndex}
        handleSearch={handleSearch}
        setShowDropdown={setShowDropdown}
      />
    </div>
  )
}

function SearchResults({ searchTerm } : { searchTerm: string }) {
  const [queryResult, setQueryResults] = useState<QueryResult | undefined>(undefined);

  function Pagination({queryResult} : {queryResult: QueryResult | undefined}) {
    if (queryResult) {
      const total = queryResult.TotalNumberOfResults;
      if (total > 0) {
        let start: number;
        if (queryResult.Page === 1) {
          start = 1;
        } else {
          start = (queryResult.Page-1) * queryResult.PageSize;
        }
        const end = queryResult.Page * queryResult.PageSize;
        return (
          <div className="pagination">
            <span>Showing {start}-{end} of {total} results</span>
          </div>
        )
      } else {
        return (
          <div className="pagination">
            <span>No results found for '{searchTerm}'</span>
          </div>
        )
      }
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
          <BoldedText documentText={result.DocumentExcerpt} />
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
        if (resp?.ok) {
          return resp.json();
        } else {
          return {
            Page: 0,
            PageSize: 0,
            ResultItems: [],
            TotalNumberOfResults: 0
          };
        }
      })
      .then(result => setQueryResults(result))
      .catch(e => console.error(e));
      return () => {};
    } else {
      setQueryResults(undefined);
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