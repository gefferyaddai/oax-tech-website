document.getElementById("year").textContent = new Date().getFullYear();

// smooth scroll (basic)
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        el.scrollIntoView({behavior:"smooth", block:"start"});
    });
});

// preselect package from buttons
document.querySelectorAll("[data-pick]").forEach(btn => {
    btn.addEventListener("click", () => {
        const pick = btn.getAttribute("data-pick");
        const pkg = document.getElementById("package");
        if (pkg) pkg.value = pick;
    });
});

// form submit (front-end only demo)

document.querySelectorAll('.work-card').forEach(card => {
    card.addEventListener('click', () => {
        const url = card.dataset.url;
        if (url) {
            window.open(url, '_blank');
        }
    });
});

// Prevent button click from triggering card click
document.querySelectorAll('.work-cta').forEach(btn => {
    btn.addEventListener('click', e => {
        e.stopPropagation();
    });
});

// google sheets implementation
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwu460vS5PMkR0YaSa0cmyAnrkY0qepWrguqea_96Bx8HjvgCdUj25S6B41jAmf-t1d/exec";

const form = document.getElementById("consultForm");
const toast = document.getElementById("toast");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Validate using actual form values (NOT payload.name)
    const name = form.name.value.trim();
    const company = form.company.value.trim();
    const contact = form.contact.value.trim();
    const pkg = form.package.value.trim();
    const details = form.details.value.trim();

    if (!name || !contact || !pkg || !details) {
        console.log("Missing fields");
        return;
    }

    const btn = form.querySelector('button[type="submit"]');

    try {
        btn.disabled = true;
        btn.textContent = "Submitting...";

        const payload = new FormData();
        payload.append("name", name);
        payload.append("company", company);
        payload.append("contact", contact);
        payload.append("package", pkg);
        payload.append("details", details);

        await fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            body: payload
        });

        // no-cors hides response, so assume success if fetch didn't throw
        toast.classList.add("show");
        form.reset();

    } catch (err) {
        console.error("Submit error:", err);
        alert("Submit failed — check console.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Submit request";
    }
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////// ChatBox AI integration
 const chatbotToggle = document.getElementById('chatbotToggle');
        const chatbotContainer = document.getElementById('chatbotContainer');
        const closeBtn = document.getElementById('closeBtn');
        const chatMessages = document.getElementById('chatMessages');
        const quickActions = document.getElementById('quickActions');

        // Define the 3 main questions and their answers
        const mainQuestions = {
            "what can you do for me": {
                title: "What apps do you build?",
                answer: `We specialize in custom app development for various platforms:<br><br>
                • <strong>Mobile Apps:</strong> iOS & Android using React Native/Flutter<br>
                • <strong>Web Applications:</strong> HTML,CSS, JavaScript,React/Vue.js with Node.js/Python backends<br>
                • <strong>SaaS Platforms:</strong> Complete business solutions<br>
                • <strong>MVP Development:</strong> From idea to market in 3-4 months<br><br>
                <em>What type of app are you considering?</em>`
            },
            "how much will it cost": {
                title: "What is the typical cost?",
                answer: `Our pricing depends on scope, but here are typical ranges:<br><br>
                • <strong>One-page landing:</strong> $399<br>
                • <strong>Best for service businesses:</strong> $899<br>
                • <strong>Custom options:</strong> $1,799+<br><br>
                <em>For an accurate estimate, we'd need to understand your specific requirements. Would you like to schedule a free consultation?</em>`
            },
            "how do i start": {
                title: "How do I talk to an expert?",
                answer: `To get started:<br><br>
                1. <strong>Free Consultation:</strong> 30-minute call with our lead developer<br>
                2. <strong>Project Analysis:</strong> We review your needs in detail<br>
                3. <strong>Proposal:</strong> Detailed plan with timeline & cost<br>
                4. <strong>Development:</strong> We build your app in agile sprints<br><br>
                <em>Would you like to schedule a call or share your contact details?</em>`
            }
        };

        // Company Summary (for other questions)
        const companySummary = `
            <div class="company-summary">
                <h4>About Our App Development Company</h4>
                <p><strong>🏆 Expertise:</strong> We build custom web and mobile applications for startups and enterprises.</p>
                <p><strong>🎯 Focus:</strong> Turning your ideas into functional, scalable, and user-friendly apps.</p>
                <p><strong>🛠️ Process:</strong> From initial concept to deployment and maintenance.</p>
                <p><strong>📞 Next Steps:</strong> For specific questions about pricing, timelines, or project details, please:</p>
                <p>1. Ask one of the main questions above, or<br>
                2. Visit our website: <a href="#" onclick="showCompanyWebsite()"> Page URL</a><br>
                3. Email us directly: <a href="mailto:hello@example.com">hello@example.com</a></p>
            </div>
        `;

        // Opening message that clearly states the chatbot's limited scope
        const openingMessage = `Hello! I'm your App Development Assistant. I'm specifically programmed to answer these 3 main questions:<br><br>
        1. <strong>"What apps do you build?"</strong> - Our expertise and capabilities<br>
        2. <strong>"How much will it cost?"</strong> - Pricing guidelines and estimates<br>
        3. <strong>"How do I start?"</strong> - Process and next steps<br><br>
        <em>For any other questions, I'll provide a company summary and direct you to the right contact.</em><br><br>
        Which question can I help you with?`;

        // Initialize chat with clear instructions
        function initChat() {
            addBotMessage(openingMessage);
            showMainQuestionButtons();
        }

        // Add message to chat
        function addMessage(text, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
            messageDiv.innerHTML = text;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        // Add bot message with typing indicator
        function addBotMessage(text) {
            // Show typing indicator
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.innerHTML = '<span></span><span></span><span></span>';
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Remove typing indicator and show message after delay
            setTimeout(() => {
                chatMessages.removeChild(typingDiv);
                addMessage(text, false);
                
                // Show main buttons again after answering
                setTimeout(() => {
                    showMainQuestionButtons();
                }, 500);
            }, 800);
        }

        // Show the 3 main question buttons
        function showMainQuestionButtons() {
            quickActions.innerHTML = '';
            
            Object.keys(mainQuestions).forEach((key, index) => {
                const question = mainQuestions[key];
                const button = document.createElement('button');
                button.className = 'action-btn';
                button.innerHTML = `${index + 1}. ${question.title}`;
                button.onclick = () => handleMainQuestion(key);
                quickActions.appendChild(button);
            });
            
            // Add a free input option
            const inputDiv = document.createElement('div');
            inputDiv.style.width = '100%';
            inputDiv.style.marginTop = '10px';
            inputDiv.innerHTML = `
                <input type="text" id="freeInput" placeholder="Ask another question..." 
                       style="width: calc(100% - 70px); padding: 10px 15px; border: 1px solid #ddd; border-radius: 25px; font-size: 13px;">
                <button class="action-btn primary" onclick="handleFreeInput()" 
                        style="width: 60px; margin-left: 5px;">Ask</button>
            `;
            quickActions.appendChild(inputDiv);
            
            // Focus on input
            setTimeout(() => {
                document.getElementById('freeInput')?.focus();
            }, 100);
        }

        // Handle main question selection
        function handleMainQuestion(questionKey) {
            const question = mainQuestions[questionKey];
            addMessage(question.title, true);
            addBotMessage(question.answer);
        }

        // Handle free text input
        function handleFreeInput() {
            const input = document.getElementById('freeInput');
            const userQuestion = input.value.trim().toLowerCase();
            
            if (!userQuestion) return;
            
            addMessage(userQuestion, true);
            input.value = '';
            
            // Check if it matches any main question
            let isMainQuestion = false;
            
            for (const [key, question] of Object.entries(mainQuestions)) {
                if (userQuestion.includes(key) || 
                    question.title.toLowerCase().includes(userQuestion) ||
                    userQuestion.includes("what app") ||
                    userQuestion.includes("how much") ||
                    userQuestion.includes("cost") ||
                    userQuestion.includes("how do i start") ||
                    userQuestion.includes("talk to expert") ||
                    userQuestion.includes("begin") ||
                    userQuestion.includes("start")) {
                    
                    isMainQuestion = true;
                    setTimeout(() => {
                        addBotMessage(question.answer);
                    }, 800);
                    break;
                }
            }
            
            // If not a main question, show company summary
            if (!isMainQuestion) {
                setTimeout(() => {
                    addBotMessage(`I'm specifically programmed to answer the 3 main questions about our app development services. Since your question isn't one of those, here's a summary of our company:`);
                    
                    // Add company summary
                    setTimeout(() => {
                        const summaryDiv = document.createElement('div');
                        summaryDiv.innerHTML = companySummary;
                        chatMessages.appendChild(summaryDiv);
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                        
                        // Show main buttons again
                        setTimeout(() => {
                            showMainQuestionButtons();
                        }, 300);
                    }, 1000);
                }, 800);
            }
        }

        // Handle Enter key in free input
        function handleKeyPress(event) {
            if (event.key === 'Enter') {
                handleFreeInput();
            }
        }

        // Show company website (placeholder)
        function showCompanyWebsite() {
            addMessage("Can I see your website?", true);
            addBotMessage(`Our website has detailed information about our services, portfolio, team, and contact details. Please visit: <a href="#" style="color: #667eea; font-weight: 500;">example.com</a><br><br>
            Would you like me to help with one of the main questions now?`);
        }

        // Toggle chatbot visibility
        chatbotToggle.addEventListener('click', () => {
            chatbotContainer.classList.remove('hidden');
            chatbotToggle.classList.add('hidden');
            if (chatMessages.children.length === 0) {
                initChat();
            }
        });

        closeBtn.addEventListener('click', () => {
            chatbotContainer.classList.add('hidden');
            chatbotToggle.classList.remove('hidden');
        });

        // Initialize on load this can be added later if needed
        document.addEventListener('DOMContentLoaded', () => {
            // // Auto-open after 3 seconds (optional)
            // setTimeout(() => {
            //     chatbotToggle.click();
            // }, 3000);
        });
