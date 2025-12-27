import '../App.css';
import { useState, useEffect} from "react";
import { fetchLocalities, Locality } from '../services/plzApi';


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


    // Debounce for locality input
    useEffect(() => {
        const handler = setTimeout(() => {
          setDebouncedLocality(locality);
        }, 1000);
      
        return () => clearTimeout(handler);
      }, [locality]);
      
      // Debounce for postal code input
      useEffect(() => {
        const handler = setTimeout(() => {
          setDebouncedPostalCode(postalCode);
        }, 1000);
      
        return () => clearTimeout(handler);
      }, [postalCode]);

        
    useEffect(() => {
        if (mode !== "postalCode") return;
        console.log("Mode is: ", mode);

        setLocality("");
        setLocalitySuggestions([]);
        setError("");

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
        }).catch(() => {
          setLocality("");
          setLocalitySuggestions([]);
          setError("Error fetching localities.");
        });
        console.log("Now in postal code: ", locality, postalCode); 
      }, [debouncedPostalCode, mode]);


    useEffect(() => {
        console.log("Mode is: ", mode);
        if (mode !== "locality" || isSelectionMade) return;
        console.log("Now in locality ");
        setPostalCodeOptions([]);
        setPostalCode("");

        if (debouncedLocality.trim().length < 3) {
          setLocalitySuggestions([]);
          return;
        }
      
        fetchLocalities(debouncedLocality, "", false)
          .then(data => {
            setLocalitySuggestions(data);
            if(data.length === 0) {
                setError("No matching city found.");
                setPostalCodeOptions([]); 
                setPostalCode("");
            } else {
                setError("");
            }
         
          })
          .catch(() => {
            setLocalitySuggestions([]);
            setError("Error fetching localities.");
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
                setError("No postal codes found for this locality.");

            } else if (data.length === 1) {
                setPostalCodeOptions([]);
                setPostalCode(data[0].postalCode);
                setError("");

            } else {
                setPostalCodeOptions(data.map(d => d.postalCode));
                setPostalCode("");
                setError("");
                
            }
            }).catch(() => {
            setPostalCodeOptions([]);
            setPostalCode("");
            setError("Error fetching postal codes.");
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
    <div>
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

            <div className='field'>
                <label className="floating-label">
                    {postalCodeOptions.length > 1 ? (
                        <select
                            value={postalCode}
                            onChange={e => setPostalCode(e.target.value)
                            }
                            required
                        >
                            <option value="">Select Postal Code</option>
                                {postalCodeOptions.map((code) => (
                                    <option key={code} value={code}>
                                    {code}
                                    </option>
                                ))}
                        </select>
                        ) : (
                        <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={postalCode}
                        onChange={(e) =>  {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                            setMode("postalCode");
                            setPostalCode(value);
                            setIsSelectionMade(false)}}
                        required
                        placeholder=' '
                        />
                    )}
                    <span>Postal Code</span>
                </label>
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