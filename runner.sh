function get_offers_json() {
  grep PROVIDER_OFFERS_JSON .env | cut -d '=' -f 2-
}

function count_elements() {
  local elements=$1
  local i=0

  for el in ${elements[@]}; do
    ((i++))
  done

  echo $i
}

function get_order_ids() {
  local offer_id=$1
  local status=$2
  local save_to="./list.json"

  output=$(./tool/spctl orders list --config ./tool/config.json --limit 1000 --offers $offer_id --status $status --fields id --save-to $save_to)

  cat $save_to | jq -r '.list[].id'
}

function complete_order() {
  local order_id=$1
  local offer_id=$2

  ./tool/spctl orders complete --config ./tool/config.json --status done --result ./resources/$offer_id.json $order_id
}

function get_field() {
  local json=$1
  local field=$2
  echo "$json" | jq -r ".$field"
}

function create_resource_file_content() {
  local encryption=$1
  local resource=$2
  jq -n --argjson encryption "$encryption" --argjson resource "$resource" '{encryption: $encryption, resource: $resource}'
}

function write_to_file() {
  local id=$1
  local value=$2
  mkdir -p resources
  echo "$value" > "resources/$id.json"
}

function create_resource_files() {
  local offers_json=$1

  echo "$offers_json" | jq -c '.[]' | while read -r offer; do
    offerId=$(get_field "$offer" id)
    encryption=$(get_field "$offer" encryption)
    resource=$(get_field "$offer" resource)

    resource_file_content=$(create_resource_file_content "$encryption" "$resource")

    write_to_file "$offerId" "$resource_file_content"
  done
}

function complete_orders() {
  local offers_json=$1
  local statuses_to_complete=(new processing)

  echo "$offers_json" | jq -c '.[]' | while read -r offer; do
    offer_id=$(get_field "$offer" id)

    for status in ${statuses_to_complete[@]}; do
      echo Getting order ids with offer "$offer_id" and status "'$status'"

      order_ids=$(get_order_ids "$offer_id" "$status")
      count=$(count_elements "$order_ids")

      echo "Got $count orders"

      for order_id in ${order_ids[@]}; do
        echo Completing order $order_id with offer "$offer_id"
        complete_order "$order_id" "$offer_id"
      done
    done
  done
}

function main() {
  offers_json=$(get_offers_json)

  create_resource_files "$offers_json"
  while true; do
    complete_orders "$offers_json"
    echo "Waiting 5 minutes"
    sleep "$((60 * 5))"
  done
}

main
