"use client";
import { useState, useEffect, Suspense, useMemo } from "react";
import { list, post } from "@/app/api/api";
import Image from "next/image";
import Link from "next/link";
import Filters from "./Filters";
import FiltersMobile from "./FilterMobile";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import element from "@/assets/shapes/shape-brown.png";
import element2 from "@/assets/shapes/shape-little-meat.png";
import leaf from "@/assets/shapes/leaf-cut.png";
import { usePathname, useRouter } from "next/navigation";
import { ThumbSuspense } from "@/_components/thumb-suspense";
import { currencyFormat } from "@/helpers/functions";
import { generateBreadcrumbSchema } from "@/_functions";
import { CategoryChildren } from "@/_components/category/category-children";

const Categories = ({
  filter,
  singleCategory,
  products,
  text,
  slug,
  sectionSlug,
  path,
  base_url,
  category_id,
}) => {
  const params = useSearchParams();
  const router = useRouter();
  // const [productData, setProductData] = useState({
  //   products: products?.items,
  //   pagination: products?.pagination,
  // });

  const [sort, setSort] = useState({ field: "new", direction: "asc" });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [availableFilters, setAvailableFilters] = useState(filter);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [changeFilters, setChangeFilters] = useState(false);
  const [tempSelectedFilters, setTempSelectedFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSelectedFilterKey, setLastSelectedFilterKey] = useState("");
  const pathname = usePathname();

  const [lastScrollPos, setLastScrollPos] = useState(0);

  useEffect(() => {
    const savedScrollPos = parseInt(localStorage.getItem("scrollPos"), 10);
    if (!isNaN(savedScrollPos)) {
      setLastScrollPos(savedScrollPos);
    }
    const handleScroll = () => {
      const scrollPos = window.pageYOffset;
      setLastScrollPos(scrollPos);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const { data: productData, isFetching } = useQuery({
    queryKey: [
      "products",
      params?.get("strana"),
      limit,
      params?.get("sort"),
      params?.get("filteri"),
      slug,
    ],
    queryFn: async () => {
      // router.refresh();
      let sort_URL = (params?.get("sort") ?? "_")?.split("_");
      const sort_obj = {
        field: sort_URL[0] ?? "",
        direction: sort_URL[1] ?? "",
      };

      let page_URL = Number(params?.get("strana")) ?? 1;

      let filters_URL = (params?.get("filteri") ?? ",").split(",");

      const filters_arr_tmp = filters_URL?.map((filter) => {
        const selectedColumn = filter?.split("=")[0];
        const selectedValues_tmp = filter?.split("=")[1];
        const selectedValues = selectedValues_tmp?.split("_");

        return {
          column: selectedColumn,
          value: {
            selected: selectedValues,
          },
        };
      });

      if (filters_arr_tmp?.some((column) => column?.column)) {
        setSelectedFilters(filters_arr_tmp);
      } else {
        setSelectedFilters([]);
      }
      setPage(page_URL);
      setSort(sort_obj);
      return await list(
        !slug
          ? `/products/category/list/${category_id}`
          : `/products/section/list/${slug}`,
        {
          sort: sort_obj ?? sort,
          page: page_URL ?? page,
          limit: limit,
          filters: filters_arr_tmp?.every((column) => column?.column)
            ? filters_arr_tmp
            : [],
          render: false,
        },
      ).then((res) => {
        setChangeFilters(true);
        return res?.payload;
      });
    },
    refetchOnWindowFocus: false,
  });

  const { data: gtm_data, isFetching: isLoadingGTM } = useQuery({
    queryKey: [
      "productsForGTM",
      params?.get("strana"),
      limit,
      params?.get("sort"),
      params?.get("filteri"),
      slug,
    ],
    queryFn: async () => {
      // router.refresh();
      let sort_URL = (params?.get("sort") ?? "_")?.split("_");
      const sort_obj = {
        field: sort_URL[0] ?? "",
        direction: sort_URL[1] ?? "",
      };

      let page_URL = Number(params?.get("strana")) ?? 1;

      let filters_URL = (params?.get("filteri") ?? ",").split(",");

      const filters_arr_tmp = filters_URL?.map((filter) => {
        const selectedColumn = filter?.split("=")[0];
        const selectedValues_tmp = filter?.split("=")[1];
        const selectedValues = selectedValues_tmp?.split("_");

        return {
          column: selectedColumn,
          value: {
            selected: selectedValues,
          },
        };
      });

      if (filters_arr_tmp?.some((column) => column?.column)) {
        setSelectedFilters(filters_arr_tmp);
      } else {
        setSelectedFilters([]);
      }
      setPage(page_URL);
      setSort(sort_obj);
      return await list(
        !slug
          ? `/products/category/list/${category_id}`
          : `/products/section/list/${slug}`,
        {
          sort: sort_obj ?? sort,
          page: page_URL ?? page,
          limit: limit,
          filters: filters_arr_tmp?.every((column) => column?.column)
            ? filters_arr_tmp
            : [],
          render: true,
        },
      ).then((res) => {
        setChangeFilters(true);
        return res?.payload;
      });
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (changeFilters) {
      post(
        !slug
          ? `/products/category/filters/${category_id}`
          : `/products/section/filters/${slug}`,
        {
          filters: selectedFilters,
        },
      ).then((response) => {
        const lastSelectedFilterValues = selectedFilters?.find((item) => {
          return item?.column === lastSelectedFilterKey;
        });

        const lastSelectedFilter = availableFilters?.find((item) => {
          return item?.key === lastSelectedFilterKey;
        });

        const filterLastSelectedFromResponse = response?.payload?.filter(
          (item) => {
            return item?.key !== lastSelectedFilterKey;
          },
        );

        const indexOfLastSelectedFilter = availableFilters?.findIndex(
          (index) => {
            return index?.key === lastSelectedFilterKey;
          },
        );

        if (
          lastSelectedFilter &&
          lastSelectedFilterValues?.value?.selected?.length > 0
        ) {
          setAvailableFilters([
            ...filterLastSelectedFromResponse.slice(
              0,
              indexOfLastSelectedFilter,
            ),
            lastSelectedFilter,
            ...filterLastSelectedFromResponse.slice(indexOfLastSelectedFilter),
          ]);
        } else {
          setAvailableFilters(response?.payload);
        }
      });
      setChangeFilters(false);
    }
  }, [changeFilters]);

  const [productsPerView, setProductsPerView] = useState(5);
  const [productsPerViewMobile, setProductsPerViewMobile] = useState(2);
  const [filterOpen, setFilterOpen] = useState(false);

  const updateURLQuery = (sort, page, selectedFilters) => {
    let sort_tmp;
    let page_tmp;
    let filters_tmp;

    if (sort?.field !== "" && sort?.direction !== "") {
      sort_tmp = `${sort?.field}_${sort?.direction}`;
    }
    if (page > 1) {
      page_tmp = page;
    }

    if (selectedFilters?.length > 0) {
      filters_tmp = selectedFilters?.map((filter) => {
        const selectedValues = filter?.value?.selected?.join("_");
        return `${filter?.column}=${selectedValues}`;
      });
    } else {
      filters_tmp = "";
    }

    return { sort_tmp, page_tmp, filters_tmp };
  };

  //ne koristiti singleCategory.slug_path, jer dolazi do infinite loop-a, iz razloga sto strana vidi samo poslednji segment, a slug path sadrzi /
  const slug_path = singleCategory?.slug;

  useEffect(() => {
    const { sort_tmp, filters_tmp, page_tmp } = updateURLQuery(
      sort,
      page,
      selectedFilters,
    );

    const generateQueryString = (sort_tmp, filters_tmp, page_tmp) => {
      let queryString = `?${filters_tmp ? `filteri=${filters_tmp}` : ""}${filters_tmp && (sort_tmp || page_tmp) ? "&" : ""
        }${sort_tmp ? `sort=${sort_tmp}` : ""}${sort_tmp && page_tmp ? "&" : ""}${page_tmp ? `strana=${page_tmp}` : ""
        }`;

      router.push(queryString, { scroll: false });
    };

    generateQueryString(sort_tmp, filters_tmp, page_tmp);
  }, [sort, selectedFilters, page]);

  const getPaginationArray = (selectedPage, totalPages) => {
    const start = Math.max(1, selectedPage - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const memoizedItems = useMemo(() => {
    return productData?.items?.map(({ id }) => {
      return (
        <Suspense
          key={id}
          fallback={
            <div
              className={`col-span-1 aspect-2/3 h-full w-full animate-pulse bg-slate-300`}
            />
          }
        >
          <ThumbSuspense categoryId={category_id} id={id} />
        </Suspense>
      );
    });
  }, [productData, path]);

  const renderPrices = (item) => {
    switch (item?.product_type) {
      case "variant":
        switch (item?.price?.discount?.active) {
          case true:
            return item?.price?.min?.price?.original ===
              item?.price?.max?.price?.original
              ? currencyFormat(item?.price?.price?.discount)
              : `${currencyFormat(
                item?.price?.min?.price?.discount,
              )} - ${currencyFormat(item?.price?.max?.price?.discount)}`;
          case false:
            return item?.price?.min?.price?.original ===
              item?.price?.max?.price?.original
              ? currencyFormat(item?.price?.min?.price?.original)
              : `${currencyFormat(
                item?.price?.min?.price?.original,
              )} - ${currencyFormat(item?.price?.max?.price?.original)}`;
        }
        break;
      case "single":
        return item?.price?.discount?.active
          ? currencyFormat(item?.price?.price?.discount)
          : currencyFormat(item?.price?.price?.original);
    }
  };

  const breadcrumbs_schema = generateBreadcrumbSchema(
    singleCategory?.parents,
    singleCategory?.basic_data?.name,
    path,
    base_url,
  );

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs_schema) }}
      ></script>
      <div className="mt-[30px] md:mt-[80px]">
        <div className="grid grid-cols-2">
          <div className="relative col-span-1 flex flex-col items-center justify-center max-md:col-span-2 md:pl-[8%]">
            <Image
              src={leaf}
              width={600}
              height={800}
              className={`absolute -top-[3rem] left-0 z-[0] opacity-[0.8]`}
            />
            <div>
              <div className="relative z-[4] flex w-fit flex-wrap items-center gap-2 rounded-[24px] bg-black bg-opacity-[0.2] py-2 pl-6 pr-[4.4rem] max-md:ml-[1.5rem] md:py-4">
                <Link
                  href={`/`}
                  className="text-xs text-[#191919] md:text-[1.5rem]"
                >
                  Početna /{" "}
                </Link>
                {pathname?.includes("preporuceno") ? <p>Preporučeno</p> : null}
                {singleCategory?.parents?.map((breadcrumb, index, arr) => {
                  return (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${breadcrumb?.link?.link_path}`}
                        className="text-xs font-normal text-[#191919] md:text-[1.5rem]"
                      >
                        {breadcrumb?.name}
                      </Link>
                      {index !== arr.length - 1 && (
                        <span className="text-xs max-md:mb-1 md:text-[1.5rem]">
                          /
                        </span>
                      )}
                    </div>
                  );
                })}
                <p className="text-xs text-[#191919] md:text-[1.5rem]">
                  {singleCategory?.parents?.length > 0 && "/ "}{" "}
                  {singleCategory?.basic_data?.name}
                </p>
              </div>

              <div className="relative flex flex-col">
                <h1 className="relative z-[2] pl-[1.5rem] text-[40px] md:text-[72px]">
                  {singleCategory?.basic_data?.name ?? text ?? ""}
                </h1>
                <p
                  className="relative z-[2] pl-[1.5rem] text-xs leading-[29px] sm:mt-[1rem] md:text-[1.5rem]"
                  dangerouslySetInnerHTML={{
                    __html: singleCategory?.basic_data?.short_description,
                  }}
                ></p>
                <p
                  className="relative z-[2] pl-[1.5rem] text-xs leading-[29px] sm:mt-[1rem] md:text-[1.5rem]"
                  dangerouslySetInnerHTML={{
                    __html: singleCategory?.basic_data?.description,
                  }}
                ></p>
                <Image
                  src={element2}
                  width={200}
                  height={140}
                  className="absolute -left-[8rem] top-[3rem] z-[1]"
                  alt={`HOB`}
                />
              </div>
            </div>
          </div>
          {singleCategory?.images?.image ? (
            <div className="relative z-[2] col-span-1 pr-[20%] pt-[2.2rem] max-md:col-span-2 max-md:mt-[3rem]" style={{ minHeight: "560px" }}>
              <div className="relative flex items-start">
                <Image
                  src={singleCategory?.images?.image}
                  width={560}
                  height={560}
                  alt={`${singleCategory?.basic_data?.name ?? "HOB Brand Group"}`}
                  className="relative z-[6] ml-4 rounded-[1.6rem]"
                />
                <div className="absolute -top-[3.6rem] left-[5rem] z-[4] h-[300px] w-[300px] rounded-[60px] border border-white md:left-[7rem] md:h-[520px] md:w-[540px]"></div>
                <Image
                  src={element}
                  width={570}
                  height={570}
                  alt="HOB"
                  className="absolute -top-[2rem] left-[4rem] z-[1]"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <CategoryChildren slug={category_id} />
      <div className="mt-[67px] max-md:hidden">
        <Filters
          selectedFilters={selectedFilters}
          availableFilters={availableFilters}
          setSelectedFilters={setSelectedFilters}
          sort={sort}
          setPage={setPage}
          setSort={setSort}
          changeFilters={changeFilters}
          pagination={productData?.pagination}
          setProductsPerView={setProductsPerView}
          productsPerView={productsPerView}
          setTempSelectedFilters={setTempSelectedFilters}
          setLastSelectedFilterKey={setLastSelectedFilterKey}
          setChangeFilters={setChangeFilters}
          filter={filter}
        />
      </div>
      <div
        className={`sticky top-[5.8rem] z-[300] mx-auto mt-5 flex w-[92%] items-center gap-5 rounded-[22px] bg-[#9f7361] py-2 pl-2 pr-4 text-white md:hidden`}
      >
        <button
          className={`flex w-fit flex-1 items-center justify-center rounded-[18px] border py-2 text-center text-[16px] md:text-[1.2rem]`}
          onClick={() => setFilterOpen(true)}
        >
          Filteri
        </button>
        <div className={`flex items-center gap-3`}>
          {/*a div 40px high and 40px wide*/}
          <div
            className={`h-[30px] w-[30px] border-2 ${productsPerViewMobile === 1 && "border-white"
              }`}
            onClick={() => setProductsPerViewMobile(1)}
          ></div>
          {/*a div 40px high and 40px wide that has 9 smaller squares inside*/}
          <div
            className={`grid h-[30px] w-[30px] grid-cols-2 border ${productsPerViewMobile === 2 && "border-white"
              }`}
            onClick={() => setProductsPerViewMobile(2)}
          >
            {Array.from({ length: 4 }, (_, i) => {
              return (
                <div
                  key={i}
                  className={`col-span-1 border ${productsPerViewMobile === 2 && "border-white"
                    }`}
                ></div>
              );
            })}
          </div>
        </div>
      </div>
      <>
        <div className={`px-[3rem] max-lg:hidden 2xl:px-[7rem]`}>
          <div
            className={`mt-[4rem] ${productsPerView === 2 && "mx-auto w-[50%]"
              } grid grid-cols-${productsPerView} gap-x-[10px] gap-y-10`}
          >
            {memoizedItems}
          </div>
        </div>
        <div className={`mx-auto w-[95%] lg:hidden`}>
          <div
            className={`mt-[50px] grid grid-cols-${productsPerViewMobile} gap-x-[20px] gap-y-[36px] max-md:gap-x-[10px] md:grid-cols-3`}
          >
            {memoizedItems}
          </div>
        </div>
      </>

      {productData?.pagination?.total_pages > 1 && (
        <div
          className={`mt-[5rem] flex items-center justify-center gap-1 px-[3rem] py-2`}
        >
          {getPaginationArray(
            productData.pagination.selected_page,
            productData.pagination.total_pages,
          ).map((num, index, array) => (
            <>
              {index === 0 && num !== 1 && (
                <>
                  <span
                    className={`cursor-pointer select-none rounded-xl bg-black/20 px-5 py-2 text-[20px] text-white hover:bg-[#00000060]`}
                    onClick={() => {
                      setPage(1);
                      window.scrollTo(0, 0);
                    }}
                  >
                    1
                  </span>
                  {num - 1 !== 1 && (
                    <span className={`select-none rounded-lg px-5 py-2`}>
                      ...
                    </span>
                  )}
                </>
              )}
              {index > 0 && num - array[index - 1] > 1 && (
                <span className={`select-none rounded-lg px-3 py-1`}>...</span>
              )}
              <span
                className={`${num === productData.pagination.selected_page
                  ? "cursor-pointer select-none rounded-xl bg-black px-5 py-2 text-[20px] text-white"
                  : "cursor-pointer select-none rounded-xl bg-black/20 px-5 py-2 text-[20px] text-white hover:bg-[#00000060]"
                  }`}
                onClick={() => {
                  setPage(num);
                  window.scrollTo(0, 0);
                }}
              >
                {num}
              </span>
              {index === array.length - 1 &&
                num !== productData.pagination.total_pages && (
                  <>
                    {productData.pagination.total_pages - num !== 1 && (
                      <span className={`select-none rounded-lg px-3 py-1`}>
                        ...
                      </span>
                    )}
                    <span
                      className={`cursor-pointer select-none rounded-xl bg-black/20 px-5 py-2 text-[20px] text-white hover:bg-[#00000060]`}
                      onClick={() => {
                        setPage(productData.pagination.total_pages);
                        window.scrollTo(0, 0);
                      }}
                    >
                      {productData.pagination.total_pages}
                    </span>
                  </>
                )}
            </>
          ))}
        </div>
      )}
      {singleCategory?.basic_data?.long_description && (
        <div
          className={`prose:!max-w-full prose mt-[5rem] !max-w-full px-[3rem] 2xl:px-[7rem]`}
          dangerouslySetInnerHTML={{
            __html: singleCategory?.basic_data?.long_description,
          }}
        ></div>
      )}
      <div
        className={
          filterOpen
            ? `fixed left-0 top-0 z-[3000] h-[100dvh] w-full translate-x-0 bg-white duration-500`
            : `fixed left-0 top-0 z-[3000] h-[100dvh] w-full -translate-x-full bg-white duration-500`
        }
      >
        <FiltersMobile
          selectedFilters={selectedFilters}
          availableFilters={availableFilters}
          setSelectedFilters={setSelectedFilters}
          sort={sort}
          setPage={setPage}
          setSort={setSort}
          changeFilters={changeFilters}
          pagination={productData?.pagination}
          setProductsPerView={setProductsPerView}
          productsPerView={productsPerView}
          setFilterOpen={setFilterOpen}
          setTempSelectedFilters={setTempSelectedFilters}
          setChangeFilters={setChangeFilters}
          tempSelectedFilters={tempSelectedFilters}
          setLastSelectedFilterKey={setLastSelectedFilterKey}
        />
      </div>
    </div>
  );
};

export default Categories;
