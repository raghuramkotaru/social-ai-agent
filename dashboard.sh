#!/bin/bash

# Social AI Agent - Terminal Dashboard
# Usage: ./dashboard.sh [VIDEO_ID]

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Unicode symbols
CHECK="✓"
CROSS="✗"
ARROW="→"
STAR="★"

# Get video ID from argument or use default
VIDEO_ID="${1:-N5d6eH_7BUI}"
API_URL="http://localhost:5000"

clear

# Header
echo -e "${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║          🤖  SOCIAL AI AGENT DASHBOARD                      ║"
echo "║              Intelligent Comment Management                  ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Fetch dashboard data
echo -e "${GRAY}Fetching analytics...${NC}\n"
RESPONSE=$(curl -s "${API_URL}/api/analytics/dashboard/${VIDEO_ID}")

if [ $? -ne 0 ]; then
    echo -e "${RED}${CROSS} Failed to connect to server${NC}"
    echo -e "${YELLOW}Make sure the server is running: npm start${NC}"
    exit 1
fi

# Check if response is valid JSON
if ! echo "$RESPONSE" | jq empty 2>/dev/null; then
    echo -e "${RED}${CROSS} Invalid response from server${NC}"
    echo "$RESPONSE"
    exit 1
fi

# Extract data using jq
VIDEO_TITLE=$(echo "$RESPONSE" | jq -r '.video.title')
VIDEO_VIEWS=$(echo "$RESPONSE" | jq -r '.video.viewCount')
VIDEO_LIKES=$(echo "$RESPONSE" | jq -r '.video.likeCount')

TOTAL=$(echo "$RESPONSE" | jq -r '.summary.total')
HIDDEN=$(echo "$RESPONSE" | jq -r '.summary.actions.hidden')
REPLIED=$(echo "$RESPONSE" | jq -r '.summary.actions.replied')
FLAGGED=$(echo "$RESPONSE" | jq -r '.summary.actions.flagged')
IGNORED=$(echo "$RESPONSE" | jq -r '.summary.actions.ignored')

POS_COUNT=$(echo "$RESPONSE" | jq -r '.summary.sentiment.positive.count // 0')
POS_PCT=$(echo "$RESPONSE" | jq -r '.summary.sentiment.positive.percentage // 0')
NEU_COUNT=$(echo "$RESPONSE" | jq -r '.summary.sentiment.neutral.count // 0')
NEU_PCT=$(echo "$RESPONSE" | jq -r '.summary.sentiment.neutral.percentage // 0')
NEG_COUNT=$(echo "$RESPONSE" | jq -r '.summary.sentiment.negative.count // 0')
NEG_PCT=$(echo "$RESPONSE" | jq -r '.summary.sentiment.negative.percentage // 0')

# Video Info
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}📹 Video Information${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GRAY}Title:${NC}      ${WHITE}${VIDEO_TITLE}${NC}"
echo -e "${GRAY}Video ID:${NC}   ${BLUE}${VIDEO_ID}${NC}"
echo -e "${GRAY}Views:${NC}      ${GREEN}${VIDEO_VIEWS}${NC}"
echo -e "${GRAY}Likes:${NC}      ${GREEN}${VIDEO_LIKES}${NC}"
echo ""

# Comments Summary
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}💬 Comments Summary${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}Total Comments Processed:${NC} ${YELLOW}${TOTAL}${NC}"
echo ""

# Actions Taken
echo -e "${WHITE}Actions Taken:${NC}"
echo -e "  ${RED}🗑️  Hidden (Spam):${NC}     ${RED}${HIDDEN}${NC}"
echo -e "  ${GREEN}💬 Replied:${NC}           ${GREEN}${REPLIED}${NC}"
echo -e "  ${YELLOW}🚩 Flagged:${NC}           ${YELLOW}${FLAGGED}${NC}"
echo -e "  ${GRAY}⏭️  Ignored:${NC}           ${GRAY}${IGNORED}${NC}"
echo ""

# Sentiment Breakdown
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}📊 Sentiment Analysis${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Function to create progress bar
create_bar() {
    local percentage=$1
    local color=$2
    local width=30
    local filled=$(echo "scale=0; $percentage * $width / 100" | bc)
    local empty=$((width - filled))
    
    echo -n -e "${color}"
    for ((i=0; i<filled; i++)); do echo -n "█"; done
    echo -n -e "${GRAY}"
    for ((i=0; i<empty; i++)); do echo -n "░"; done
    echo -e "${NC}"
}

# Positive
echo -n -e "${GREEN}😊 Positive:${NC} "
create_bar "$POS_PCT" "$GREEN"
echo -e "   ${WHITE}${POS_COUNT}${NC} comments (${GREEN}${POS_PCT}%${NC})"
echo ""

# Neutral
echo -n -e "${YELLOW}😐 Neutral:${NC}  "
create_bar "$NEU_PCT" "$YELLOW"
echo -e "   ${WHITE}${NEU_COUNT}${NC} comments (${YELLOW}${NEU_PCT}%${NC})"
echo ""

# Negative
echo -n -e "${RED}😞 Negative:${NC} "
create_bar "$NEG_PCT" "$RED"
echo -e "   ${WHITE}${NEG_COUNT}${NC} comments (${RED}${NEG_PCT}%${NC})"
echo ""

# Top Issues
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${WHITE}⚠️  Top Issues${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ISSUES_COUNT=$(echo "$RESPONSE" | jq -r '.summary.topIssues | length')

if [ "$ISSUES_COUNT" -eq 0 ]; then
    echo -e "${GREEN}${CHECK} No issues detected!${NC}"
else
    echo "$RESPONSE" | jq -r '.summary.topIssues[] | 
        "\(.author): \(.text)\n   Sentiment: \(.sentiment) (Score: \(.score))\n"' | 
        head -15 | 
        sed "s/^/  ${RED}▸${NC} /"
fi

echo ""

# Footer
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GRAY}Last updated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${GRAY}API: ${API_URL}${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""