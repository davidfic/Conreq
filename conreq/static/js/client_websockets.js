let first_websocket_connection = true;
let display_disconnected_toast = true;

// HELPER FUNCTIONS
let obtain_common_parameters = function (
  tmdb_id = null,
  tvdb_id = null,
  content_type = null
) {
  let url_params = new URLSearchParams(window.location.hash.split("?")[1]);
  let results = { tmdb_id: null, tvdb_id: null, content_type: null };

  // Content Type
  if (content_type != null) {
    results.content_type = content_type;
  } else if (url_params.has("content_type")) {
    results.content_type = url_params.get("content_type");
  }
  // TMDB ID
  if (tmdb_id != null) {
    results.tmdb_id = tmdb_id;
  } else if (url_params.has("tmdb_id")) {
    results.tmdb_id = url_params.get("tmdb_id");
  }
  // TVDB ID
  if (tvdb_id != null) {
    results.tvdb_id = tvdb_id;
  } else if (url_params.has("tvdb_id")) {
    results.tvdb_id = url_params.get("tvdb_id");
  }

  // Return calculated parameters
  return results;
};

// WEBSOCKET CREATION
var COMMAND_SOCKET = null;
let RETRY_COUNTER = 0;
let MAX_FAST_RETRIES = 30;

function connect() {
  // Note: this websocket automatically reconnects upon disconnection
  let loc = window.location;
  let ws_start = "";
  if (loc.protocol == "https:") {
    ws_start = "wss://";
  } else {
    ws_start = "ws://";
  }
  let endpoint = ws_start + loc.host;
  COMMAND_SOCKET = new WebSocket(endpoint);

  // RECEIVABLE COMMANDS
  COMMAND_SOCKET.onmessage = function (response) {
    // Websocket message received, parse for JSON
    console.log(response);
    json_response = JSON.parse(response.data);

    // Check for valid commands
    if (json_response.command_name == "forbidden") {
      location.reload();
    } else if (json_response.command_name == "render page element") {
      // Determine what needs to be replaced
      let selected_element = $(json_response.selector);
      let parent_element = selected_element.parent();

      // Show the loading icon
      let loading_icon = parent_element.children(".loading-animation");
      if (loading_icon.length) {
        loading_icon.hide();
      }

      // Place the new HTML on the page
      selected_element[0].innerHTML = DOMPurify.sanitize(json_response.html);
      selected_element.show();
    } else if (json_response.command_name == "server settings") {
      if (json_response.success) {
        settings_save_success_toast_message();
      } else {
        settings_save_failed_toast_message(json_response.error_message);
      }
    } else if (json_response.command_name == "new conreq api key") {
      $("#conreq-api-key").text(json_response.value);
    } else {
      console.log(
        "Unknown command " + json_response.command_name + " received!"
      );
    }
  };

  // WEBSOCKET EVENT: ON OPEN
  COMMAND_SOCKET.onopen = function (response) {
    RETRY_COUNTER = 0;
    display_disconnected_toast = true;

    if (first_websocket_connection) {
      first_websocket_connection = false;
    } else {
      reconnected_toast_message();
    }
    console.log(response);
  };

  // WEBSOCKET EVENT: ON CLOSE
  COMMAND_SOCKET.onclose = function () {
    // Toast message to notify that the user has disconnected from the server
    if (display_disconnected_toast) {
      disconnected_toast_message();
      display_disconnected_toast = false;
    }

    // Automatically reconnect upon disconnection
    RETRY_COUNTER++;
    if (RETRY_COUNTER <= MAX_FAST_RETRIES) {
      console.log(
        RETRY_COUNTER,
        "Websocket is closed. Reconnect will be attempted in 3 second."
      );
      setTimeout(function () {
        connect();
      }, 3000);
    } else {
      console.log(
        "Websocket is closed. Reconnect will be attempted in 30 second."
      );
      setTimeout(function () {
        connect();
      }, 30000);
    }
  };

  // WEBSOCKET EVENT: ON ERROR
  COMMAND_SOCKET.onerror = function (error) {
    if (display_disconnected_toast) {
      disconnected_toast_message();
      display_disconnected_toast = false;
    }

    console.error(
      "Websocket encountered an error: ",
      error.message,
      "Closing socket..."
    );
    COMMAND_SOCKET.close();
  };
}

connect();

// SENDABLE COMMAND: REQUEST CONTENT
var request_content = function ({
  tmdb_id = null,
  tvdb_id = null,
  content_type = null,
  seasons = null,
  episode_ids = null,
}) {
  let obtained_params = obtain_common_parameters(
    tmdb_id,
    tvdb_id,
    content_type
  );
  let json_payload = {
    command_name: "request",
    parameters: {
      tmdb_id: obtained_params.tmdb_id,
      tvdb_id: obtained_params.tvdb_id,
      content_type: obtained_params.content_type,
      seasons: seasons,
      episode_ids: episode_ids,
    },
  };
  COMMAND_SOCKET.send(JSON.stringify(json_payload));

  requested_toast_message();
};

// SENDABLE COMMAND: GENERATE EPISODE MODAL
var generate_episode_modal = function (tmdb_id = null, tvdb_id = null) {
  // Hide the old content
  $("#modal-content").hide();
  // Display the loading animation
  $("#modal-dialog .spinner-border").show();

  let obtained_params = obtain_common_parameters(tmdb_id, tvdb_id);
  let json_payload = {
    command_name: "generate modal",
    parameters: {
      modal_type: "episode selector",
      tmdb_id: obtained_params.tmdb_id,
      tvdb_id: obtained_params.tvdb_id,
    },
  };
  COMMAND_SOCKET.send(JSON.stringify(json_payload));
};

// SENDABLE COMMAND: CHANGE SERVER SETTING
var change_server_setting = function (setting_name = null, value = null) {
  let json_payload = {
    command_name: "server settings",
    parameters: {
      setting_name: setting_name,
      value: value,
    },
  };
  COMMAND_SOCKET.send(JSON.stringify(json_payload));
};
