# nk-missile-tests: North Korea Missile Test Visualization

An interactive visualization of flight tests of all missiles launched by North Korea from 1984 to 2019.

![Screenshot](https://nagix.github.io/nk-missile-tests/images/screenshot.jpg)

See a [Live Demo](https://nagix.github.io/nk-missile-tests).

## Usage

Operation | Description
--- | ---
Mouse drag or swipe | Rotate the globe
Mouse wheel rotation or pinch in/out | Zoom in/out
Click or tap +/- buttons | Zoom in/out
Shift key + Mouse drag or three-finger swipe | Tilt up/down
Click or tap the tilt buttons | Tilt up/down
Click or tap a test label on the map | Select a test
Enter a date or test name in the text field | Search for a test
Click or tap ABOUT button | See the information on the database and references
Click, tap or drag the timeline bar | Select a year
Click or tap the graph icon | Show or hide the histogram
Click or tap SUCCESS, FAILURE and UNKNOWN buttons | Filter tests out by outcome
Click or tap missile check marks | Filter tests out by missile name

## About Data

The data for this visualization are sourced from [the CNS North Korea Missile Test Database](http://www.nti.org/analysis/articles/cns-north-korea-missile-test-database/), which is the first database to record flight tests of all missiles launched by North Korea capable of delivering a payload of at least 500 kilograms (1102.31 pounds) a distance of at least 300 kilometers (186.4 miles). The database captures advancements in North Korea's missile program by documenting all such tests since the first one occurred in April 1984, and will be routinely updated as events warrant.

The CNS North Korea Missile Test Database doesn't include the exact landing locations, so we have added bearing information from other sources such as Japan Ministry of Defense, and landing locations are calculated based on locations of launching facilities and distances travelled.

## Acknowledgements

nk-missile-tests is largely inspired by [Arms Globe Visualization](https://github.com/dataarts/armsglobe) project by the Google Data Arts Team, and uses the code from it.

## License

nk-missile-tests is available under the [Apache license 2.0](opensource.org/licenses/Apache-2.0).
