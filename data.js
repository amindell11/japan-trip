// Trip data lives here. Edit, commit, push — everyone sees it on refresh.
// When we migrate to Firebase later, only getTripData() changes.

const TRIP_DATA = {
  title: "Japan Trip",
  travelers: [],
  itinerary: [],
};

function getTripData() {
  return Promise.resolve(TRIP_DATA);
}
