import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Linkedin, Twitter, Mail } from "lucide-react";

// ---- Image imports from your /assets folder ----
import rupam from "../../../../assets/rupam.jpg";
import deep from "../../../../assets/deep.jpg";
import shraddha from "../../../../assets/shraddha.jpg";
import angat from "../../../../assets/angat.png";
import anil from "../../../../assets/anil.png";
import shehla from '../../../../assets/shehla.jpg';

/** Brand gradient */
const GRAD = "from-[#1a237e] to-[#4a56d2]";
const GRAD_TEXT = `bg-gradient-to-r ${GRAD} bg-clip-text text-transparent`;

const TeamSection = () => {
  const prefersReduced = useReducedMotion();

  const team = useMemo(
    () => [
      {
        id: 1,
        name: "Anil Kesi",
        role: "Founder & CEO",
        img: anil,
        bio: "Founder & CEO of UpholicTech, a fintech platform for algorithmic trading, analytics, and journaling. With 16+ years in insurance sales, he blends risk discipline with product execution.",
        // skills: ["Deep Learning", "Latency", "Infra"],
        // achievements: ["MIT PhD", "50+ AI Patents"],
        links: {
          li: "https://www.linkedin.com/in/anil-kesi-63a94617/",
          mail: "anil.kesi@upholic.in",
        },
      },
      {
        id: 2,
        name: "Shehla Khan",
        role: "Sales Head & CBO",
        img: shehla,
        bio: "Founder and Business head with 12 years of proven expertise in insurance sales, driving growth and building high-performing teams.",
        // skills: ["Strategy", "Markets", "Risk"],
        // achievements: ["Goldman Sachs VP", "Harvard MBA"],
        links: {
          li: "https://www.linkedin.com/in/shehla-khan-b927151b4/",
          mail: "shehla@upholic.in",
        },
      },
      {
        id: 3,
        name: "Deepak Saroj",
        role: "Team Lead",
        img: deep,
        bio: "Team Lead with expertise in designing, developing, and leading high-performance web applications.",
        // skills: ["Microservices", "SRE", "Cloud"],
        // achievements: ["Java Certified", "OSS maintainer"],
        links: {
          li: "https://www.linkedin.com/in/deepak-saroj-374607254/",
          mail: "bdeepaksaroj@upholic.in",
        },
      },
      {
        id: 4,
        name: "Shraddha Kubal",
        role: "Software Developer",
        img: shraddha,
        bio: "Backend-focused developer skilled in building scalable APIs, databases.",
        // skills: ["Compliance", "Stress-Testing", "Quant"],
        // achievements: ["CFA Charter", "Basel/RBI expertise"],
        links: {
          li: "https://www.linkedin.com/in/skubal-a10799215",
          mail: "shraddha.kubal@upholic.in",
        },
      },
      {
        id: 5,
        name: "Rupam Brijbhan",
        role: "Software Developer",
        img: rupam,
        bio: "Passionate MERN Stack Web Developer with expertise in designing and developing modern, user-focused web solutions.",
        // skills: ["UI/UX Design", "MERN Exp", "Architecture design"],
        // achievements: ["IBM Python Certified"],
        links: {
          li: "https://www.linkedin.com/in/rupam-yadav-b21770351/",
          // tw: "https://x.com/rider_rupam?s=21",
          mail: "rupam.brijbhan@upholic.in",
        },
      },
      {
        id: 6,
        name: "Angat Singh Wasan",
        role: "Cloud Engineer",
        img: angat,
        bio: "Expert in designing, scaling, and optimizing high-performance, cost-efficient applications on AWS.",
        // skills: ["Microservices", "system design", "Docker"],
        // achievements: ["Aws Certified"],
        links: {
          li: "http://www.linkedin.com/in/angat-singh-wasan-327bb5263",
          mail: "angat.wasan@upholic.in",
        },
      },
    ],
    []
  );

  // Motion variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: prefersReduced ? 0 : 0.08 },
    },
  } as const;

  const fadeUp = {
    hidden: { opacity: 0, y: prefersReduced ? 0 : 24, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  } as const;

  return (
    <>
    <section className="bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.header
          initial={{ opacity: 0, y: prefersReduced ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-slate-800 bg-slate-900/60">
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${GRAD}`} />
            <span className={GRAD_TEXT}>LEADERSHIP</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4 text-white">
            Leadership & <span className={GRAD_TEXT}>Core Team</span>
          </h1>
        </motion.header>

        {/* 3 across on lg */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {team.map((m) => (
            <TeamCard key={m.id} m={m} variants={fadeUp} />
          ))}
        </motion.div>
      </div>
    </section>
    </>
  );
};

type TeamMember = {
  id: number;
  name: string;
  role: string;
  img: string;
  bio: string;
  // skills: string[];
  // achievements: string[];
  links: {
    li?: string;
    tw?: string;
    mail?: string;
  };
};

type TeamCardProps = {
  m: TeamMember;
  variants: any;
};

const TeamCard = ({ m, variants }: TeamCardProps) => (
  <motion.article
    variants={variants}
    className="group rounded-2xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-colors shadow-sm hover:shadow-xl hover:shadow-black/20 will-change-transform"
    whileHover={{ y: -4 }}
  >
    {/* Media */}
    <div className="relative overflow-hidden rounded-t-2xl">
      <img
        src={m.img}
        alt={m.name}
        loading="lazy"
        className="w-full h-84 object-cover grayscale group-hover:grayscale-0 transition duration-500 ease-out"
      />
      {/* Soft overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>

    {/* Body */}
    <div className="p-6">
      <h3 className="text-xl font-semibold tracking-tight">{m.name}</h3>
      <p className="text-sm text-indigo-300 font-medium">{m.role}</p>

      <p className="mt-4 text-sm text-slate-300 leading-relaxed">{m.bio}</p>

      {/* Skills */}
      {/* <div className="mt-4 flex flex-wrap gap-2">
        {m.skills.slice(0, 3).map((s, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-full text-xs bg-white/5 text-slate-100 border border-white/10"
          >
            {s}
          </span>
        ))}
        {m.skills.length > 3 && (
          <span className="px-2.5 py-1 rounded-full text-xs bg-indigo-500/10 text-indigo-200 border border-indigo-400/30">
            +{m.skills.length - 3} more
          </span>
        )}
      </div> */}

      {/* Achievements & Social */}
      <div className="mt-5 flex items-center justify-between">
        {/* <div className="flex items-center gap-3">
          {m.achievements.slice(0, 2).map((a, i) => (
            <div key={i} className="flex items-center text-xs text-slate-400">
              <Award className="w-3 h-3 mr-1 text-amber-400" />
              <span>{a}</span>
            </div>
          ))}
        </div> */}

        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
          {m.links?.li && (
            <IconButton href={m.links.li} label="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </IconButton>
          )}
          {m.links?.tw && (
            <IconButton href={m.links.tw} label="Twitter">
              <Twitter className="w-4 h-4" />
            </IconButton>
          )}
          {m.links?.mail && (
            <IconButton href={m.links.mail} label="Email">
              <Mail className="w-4 h-4" />
            </IconButton>
          )}
        </div>
      </div>
    </div>
  </motion.article>
);

type IconButtonProps = {
  href: string;
  children: React.ReactNode;
  label: string;
};

const IconButton = ({ href, children, label }: IconButtonProps) => (
  <a
    href={href}
    aria-label={label}
    className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:scale-110 transition-all"
    target={href?.startsWith("http") ? "_blank" : undefined}
    rel={href?.startsWith("http") ? "noreferrer" : undefined}
  >
    {children}
  </a>
);

export default TeamSection;
