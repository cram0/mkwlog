# CSV Import/Export Documentation

## CSV Format

The Mario Kart World Time Logger supports importing and exporting times via CSV files with the following format:

### Column Structure

| Column | Description | Example |
|--------|-------------|---------|
| `time_of_entry` | ISO 8601 timestamp when the time was recorded | `2024-01-15T10:30:00.000Z` |
| `track` | Circuit/track name | `Mario Circuit` |
| `character` | Character name | `Mario` |
| `outfit` | Character skin/outfit | `Pro Racer` |
| `kart` | Vehicle name | `Standard Kart` |
| `race_time` | Race time in M:SS.mmm format | `1:32.456` |

### Sample CSV Content

```csv
time_of_entry,track,character,outfit,kart,race_time
2024-01-15T10:30:00.000Z,Mario Circuit,Mario,Mario,Standard Kart,1:32.456
2024-01-15T10:35:00.000Z,Rainbow Road,Luigi,Luigi,Standard Bike,2:45.123
2024-01-15T11:00:00.000Z,Bowser's Castle,Bowser,Bowser,Bowser Bruiser,1:58.789
```

## Features

### Import
- **File Validation**: Checks for required columns and validates data format
- **Profile Auto-Creation**: Automatically creates profiles for new character/outfit/vehicle combinations
- **Error Handling**: Reports invalid rows and continues processing valid ones
- **Merge Options**: Choose to replace all existing times or add to current data

### Export
- **Automatic Download**: Downloads CSV file with current date in filename
- **Complete Data**: Exports all times with full character/outfit information
- **Auto-backup**: Automatically saves CSV backup to localStorage on data changes

## Usage

1. **Import CSV**: Click "Import CSV" button and select your CSV file
2. **Export CSV**: Click "Export CSV" button to download current times
3. **Format Validation**: Import will validate time format (M:SS.mmm) and required fields

## Notes

- Times must be in M:SS.mmm format (e.g., "1:32.456")
- Character and vehicle names should match those available in the app
- Invalid rows are skipped with error reporting
- Profiles are automatically created for new character/outfit/vehicle combinations
