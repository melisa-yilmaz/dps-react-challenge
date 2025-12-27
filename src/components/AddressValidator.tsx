import '../App.css';
import { useState, useEffect} from "react";
import { fetchLocalities, Locality } from '../services/plzApi';




const DEBOUNCE_DELAY = 1000;
const MIN_LOCALITY_LENGTH = 3;
const POSTAL_CODE_LENGTH = 5;


export function AddressValidator() {

    const [locality, setLocality] = useState<string>("");
    const [localitySuggestions, setLocalitySuggestions] = useState<Locality[]>([]);
    const [isSelectionMade, setIsSelectionMade] = useState(false);
    const [debouncedLocality, setDebouncedLocality] = useState(locality);

    const [postalCode, setPostalCode] = useState<string>("");
    const [postalCodeOptions, setPostalCodeOptions] = useState<string[]>([]);
    const [debouncedPostalCode, setDebouncedPostalCode] = useState(postalCode);

    const [error, setError] = useState("");
  
    type InputMode = "idle" | "locality" | "postalCode";
    const [mode, setMode] = useState<InputMode>("idle");

    const [showPostalCodeDropdown, setShowPostalCodeDropdown] = useState(false);

    const handleFetchError = (error: any, context: 'localities' | 'postalCodes'): string => {
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          return "Network error. Please check your internet connection.";
        }
        
        if (error.response) {
          switch (error.response.status) {
            case 404:
              return context === 'localities' 
                ? "No matching cities found." 
                : "Postal code not found in the database.";
            case 429:
              return "Too many requests. Please wait a moment and try again.";
            case 500:
            case 503:
              return "Service temporarily unavailable. Please try again later.";
            default:
              return `Server error (${error.response.status}). Please try again.`;
          }
        }
        
        if (error.code === 'ECONNABORTED') {
          return "Request timed out. Please try again.";
        }
        
        return context === 'localities'
          ? "Unable to search cities. Please try again."
          : "Unable to fetch postal codes. Please try again.";
      };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          const target = event.target as HTMLElement;
          // Close postal code dropdown if clicking outside
          if (showPostalCodeDropdown && !target.closest('.field')) {
            setShowPostalCodeDropdown(false);
          }
        };
      
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, [showPostalCodeDropdown]);

    // Debounce for locality input
    useEffect(() => {
        const handler = setTimeout(() => {
          setDebouncedLocality(locality);
        }, DEBOUNCE_DELAY);
      
        return () => clearTimeout(handler);
      }, [locality]);
      
      // Debounce for postal code input
      useEffect(() => {
        const handler = setTimeout(() => {
          setDebouncedPostalCode(postalCode);
        }, DEBOUNCE_DELAY);
      
        return () => clearTimeout(handler);
      }, [postalCode]);

        
    useEffect(() => {
        if (mode !== "postalCode") return;
        console.log("Mode is: ", mode);

        setLocality("");
        setLocalitySuggestions([]);
        setError("");

        if (debouncedPostalCode.trim().length > 0 && debouncedPostalCode.trim().length < 5) {
            setError("Postal code must be 5 digits.");
        } 
        if (debouncedPostalCode.trim().length < 5) {
            return;
        } 
    
        fetchLocalities("", debouncedPostalCode, true).then((data) => {
            if (data.length === 0) {
              setLocality("");
              setLocalitySuggestions([]);
              setError("Invalid postal code.");
            } else if (data.length === 1) {
              setLocality(data[0].name);
              setLocalitySuggestions([]);
              setError("");
            } else {
              setLocality("");
              setLocalitySuggestions(data);
              setError("");
            }
          }).catch((error) => {
          setLocality("");
          setLocalitySuggestions([]);
          setError(handleFetchError(error, 'localities'));
        });
        console.log("Now in postal code: ", locality, postalCode); 
      }, [debouncedPostalCode, mode]);


    useEffect(() => {
        console.log("Mode is: ", mode);
        if (mode !== "locality" || isSelectionMade) return;
        console.log("Now in locality ");

        setPostalCodeOptions([]);
        setPostalCode("");
        setError("");
    
        if (debouncedLocality.trim().length > 0 && /\d/.test(debouncedLocality)) {
            setLocalitySuggestions([]);
            setError("City names cannot contain numbers.");
            return;
        }

        if (debouncedLocality.trim().length < MIN_LOCALITY_LENGTH) {
          setLocalitySuggestions([]);
          return;
        }
      
        fetchLocalities(debouncedLocality, "", false)
          .then(data => {
            setLocalitySuggestions(data);
            if(data.length === 0) {
                setError("No matching city found. Please check your spelling.");
                setPostalCodeOptions([]); 
                setPostalCode("");
            } else {
                setError("");
            }
          })
          .catch((error) => {
            setLocalitySuggestions([]);
            setError(handleFetchError(error, 'localities'));
          });
        console.log("Now in locality: ", locality, postalCode);   
    }, [debouncedLocality, isSelectionMade, mode]);
      
    const onSelectLocality = (locName: string) => {
        const loc = localitySuggestions.find(l => l.name === locName);
        if (!loc) return;

        setLocality(locName);
        setLocalitySuggestions([]); 
        setIsSelectionMade(true);   


        fetchLocalities(locName, "", true).then((data) => {
            console.log("fetching localities for selected locality now", data);
            if (data.length === 0) {
                setPostalCodeOptions([]);
                setPostalCode("");
                setShowPostalCodeDropdown(false);
                setError("No postal codes found for this locality.");

            } else if (data.length === 1) {
                setPostalCodeOptions([]);
                setPostalCode(data[0].postalCode);
                setShowPostalCodeDropdown(false);
                setError("");

            } else {
                const selectedCityData = data.filter(d => d.name == locName);
                setPostalCodeOptions(selectedCityData.length > 1 ? selectedCityData.map(d => d.postalCode) : []);
                setPostalCode(selectedCityData.length === 1 ? selectedCityData[0].postalCode : "") ;
                setShowPostalCodeDropdown(true);
                setError("");
            }
            }).catch((error) => {
            setPostalCodeOptions([]);
            setPostalCode("");
            setShowPostalCodeDropdown(false); 
            setError(handleFetchError(error, 'postalCodes'));
            });
        console.log("Now in selected locality: ", locality, postalCode);    
    };

    const uniqueLocalities = localitySuggestions.reduce<Locality[]>((acc, loc) => {
        if (!acc.find(item => item.name === loc.name)) {
          acc.push(loc);
        }
        return acc;
      }, []);
      

    return (
        <div className="address-validator-card">
        <div className="title">
            <h2>German Address Validator</h2>
        </div>
        
        <div className='address-row'>
            <div className='field'>
                <label className="floating-label">
                    <input
                        type="text"
                        value={locality}
                        onChange={e => {
                            setMode("locality");
                            setLocality(e.target.value);
                            setIsSelectionMade(false);
                        }}
                        placeholder=' '     
                    />
                    <span>City</span>
                </label>

                {uniqueLocalities.length > 0 && (
                    <ul className='dropdown' >
                        {uniqueLocalities.map(loc => (
                        <li className='dropdown-item'
                            key={loc.name}
                            onClick={() => onSelectLocality(loc.name)}
                        >
                            {loc.name}
                        </li>
                        ))}
                    </ul>
                    )}
            </div>

            {/* Postal Code Field */}
            <div className='field'>
            <label className="floating-label">
                <input
                type="text"
                inputMode="numeric"
                maxLength={POSTAL_CODE_LENGTH}
                value={postalCode}
                onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, POSTAL_CODE_LENGTH);
                    setMode("postalCode");
                    setPostalCode(value);
                    setIsSelectionMade(false);
                    setShowPostalCodeDropdown(false); // Hide dropdown when typing
                }}
                onFocus={() => {
                    if (postalCodeOptions.length > 1) {
                    setShowPostalCodeDropdown(true);
                    }
                }}
                required
                placeholder=' '
                readOnly={postalCodeOptions.length > 1}
                />
                <span>Postal Code</span>
            </label>

     
            {postalCodeOptions.length > 1 && showPostalCodeDropdown && (
                <ul className='dropdown'>
                {postalCodeOptions.map((code) => (
                    <li
                    className='dropdown-item'
                    key={code}
                    onClick={() => {
                        setPostalCode(code);
                        setShowPostalCodeDropdown(false);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setPostalCode(code);
                        setShowPostalCodeDropdown(false);
                        }
                  
                        if (e.key === 'Escape') {
                        setShowPostalCodeDropdown(false);
                        }
                    }}
                    tabIndex={0}
                    role="option"
                    aria-selected={postalCode === code}
                    >
                    {code}
                    </li>
                ))}
                </ul>
            )}
            </div>
        </div>
        <div className="error-container">
            {error ? (
                <p className="error-field">{error}</p>
            ) : null}
        </div>
    </div>
    );
}
