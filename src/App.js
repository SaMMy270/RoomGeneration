import React, { useState } from "react";
import RoomSelector from "./components/RoomSelector";
import DimensionSetup from "./components/DimensionSetup";
import OpeningsSetup from "./components/OpeningSetup";
import Designer from "./components/Designer";
import "./style.css";

function App() {
    // Steps: 'SELECTOR', 'DIMENSIONS', 'OPENINGS', 'DESIGNER'
    const [step, setStep] = useState('SELECTOR');

    // Core Data State
    const [roomData, setRoomData] = useState({
        shape: 'SQUARE',
        projectTitle: 'Untitled Project',
        units: 'METERS', // or 'FEET'
        dimensions: { length: 5, width: 5, notchL: 2, notchW: 2 },
        openings: [] // { type: 'DOOR'|'WINDOW', wallIndex: 0, position: 0.5 }
    });

    const updateRoomData = (newData) => {
        setRoomData(prev => ({ ...prev, ...newData }));
    };

    return (
        <div className="App">
            {step === 'SELECTOR' && (
                <RoomSelector onSelect={(shape) => {
                    updateRoomData({ shape });
                    setStep('DIMENSIONS');
                }} />
            )}

            {step === 'DIMENSIONS' && (
                <DimensionSetup
                    data={roomData}
                    onUpdate={updateRoomData}
                    onNext={() => setStep('OPENINGS')}
                    onBack={() => setStep('SELECTOR')}
                />
            )}

            {step === 'OPENINGS' && (
                <OpeningsSetup
                    data={roomData}
                    onUpdate={updateRoomData}
                    onNext={() => setStep('DESIGNER')}
                    onBack={() => setStep('DIMENSIONS')}
                />
            )}

            {step === 'DESIGNER' && (
                <Designer
                    roomData={roomData}
                    onUpdate={updateRoomData}
                    onBack={() => setStep('DIMENSIONS')}
                />
            )}
        </div>
    );
}

export default App;